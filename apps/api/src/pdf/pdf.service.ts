import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { AuthUser, UserRole } from '@repo/shared';
import { AuthographsEventStatus, PageType } from '@prisma/client';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { NotFoundBookException } from '../books/books.errors.js';
import {
  ConflictMoreThanOneActiveEventException,
  NotFoundPdfClassException,
  NotFoundPdfNoActiveEventException,
  NotFoundPdfNoEligiblePagesException,
  NotFoundPdfNoStudentsException,
  NotFoundPdfPageException,
} from './pdf.errors.js';
import { ForbiddenUserNotAdminException } from '../users/users.errors.js';

const ELIGIBLE_PAGE_TYPES: PageType[] = [
  PageType.DRAW,
  PageType.DRAW_TEXT,
  PageType.TEXT,
  PageType.COVER,
];

const PDF_MARGIN = 40;
const HEADER_HEIGHT = 130;
const QR_SIZE = 90;
const QR_X = PDF_MARGIN;
const QR_Y = PDF_MARGIN;
const TEXT_X = PDF_MARGIN + QR_SIZE + 20;
const TEXT_Y_START = PDF_MARGIN + 8;
const LINE_HEIGHT = 18;

// The separator sits at PDF_MARGIN/2 + HEADER_HEIGHT + 12 = 162.
// Content starts 18px below the separator.
const CONTENT_TOP = PDF_MARGIN / 2 + HEADER_HEIGHT + 12 + 18; // ≈ 180

// Comfortable line height for children (≈ 9–10 mm at 72 dpi).
const WRITING_LINE_HEIGHT = 34;

// Number of writing lines rendered for DRAW_TEXT and TEXT pages.
const TEXT_LINES_COUNT = 8;

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateClassPdf(classId: string, user: AuthUser): Promise<Buffer> {
    // 1. Fetch the class with template pages, unit and school
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        teacherName: true,
        schoolYear: true,
        unitId: true,
        units: {
          select: {
            id: true,
            name: true,
            school: {
              select: { id: true, name: true },
            },
          },
        },
        bookTemplate: {
          select: {
            id: true,
            name: true,
            bookTemplatePages: {
              orderBy: { pageNumber: 'asc' },
              select: { pageNumber: true, pageType: true },
            },
          },
        },
      },
    });

    if (!classRecord) throw new NotFoundPdfClassException();

    // Check access for non-admin users
    if (user.role !== UserRole.ADMIN) {
      const access = await this.prisma.userUnit.findFirst({
        where: { userId: user.id, unitId: classRecord.unitId },
        select: { id: true },
      });
      if (!access) throw new NotFoundPdfClassException();
    }

    // 2. Filter eligible template pages
    const eligiblePages = classRecord.bookTemplate.bookTemplatePages.filter(
      (p) => ELIGIBLE_PAGE_TYPES.includes(p.pageType),
    );

    if (eligiblePages.length === 0)
      throw new NotFoundPdfNoEligiblePagesException();

    // 3. Fetch students ordered by name
    const students = await this.prisma.student.findMany({
      where: { classId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    if (students.length === 0) throw new NotFoundPdfNoStudentsException();

    // 4. Fetch the active event for the unit with the same school year
    const activeEvent = await this.prisma.authographsEvent.findMany({
      where: {
        unitId: classRecord.unitId,
        schoolYear: classRecord.schoolYear,
        status: {
          in: [AuthographsEventStatus.ONGOING, AuthographsEventStatus.PLANNED],
        },
      },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent[0]) throw new NotFoundPdfNoActiveEventException();

    if (activeEvent.length > 1)
      throw new ConflictMoreThanOneActiveEventException();

    // 5. Build PDF in memory
    return this.buildPdf({
      className: classRecord.name,
      unitName: classRecord.units.name,
      schoolName: classRecord.units.school.name,
      eventName: activeEvent[0].name,
      templateId: classRecord.bookTemplate.id,
      students,
      eligiblePages,
    });
  }

  private async buildPdf(params: {
    className: string;
    unitName: string | null;
    schoolName: string;
    eventName: string;
    templateId: string;
    students: Array<{ id: string; name: string }>;
    eligiblePages: Array<{ pageNumber: number; pageType: PageType }>;
  }): Promise<Buffer> {
    const {
      className,
      unitName,
      schoolName,
      eventName,
      templateId,
      students,
      eligiblePages,
    } = params;
    const totalPagesPerStudent = eligiblePages.length;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: PDF_MARGIN,
          bottom: PDF_MARGIN,
          left: PDF_MARGIN,
          right: PDF_MARGIN,
        },
        autoFirstPage: false,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const buildPages = async () => {
        for (const student of students) {
          for (let i = 0; i < eligiblePages.length; i++) {
            const templatePage = eligiblePages[i];
            const pageNum = i + 1;

            // Generate QR code for this page
            const qrData = JSON.stringify({
              studentId: student.id,
              templateId,
              page: templatePage!.pageNumber,
            });
            const qrBuffer = await QRCode.toBuffer(qrData, {
              type: 'png',
              width: QR_SIZE,
              margin: 1,
            });

            doc.addPage();
            this.drawHeader(doc, {
              qrBuffer,
              studentName: student.name,
              className,
              unitName,
              schoolName,
              eventName,
              pageNum,
              pageType: templatePage!.pageType,
              totalPagesPerStudent,
            });
            this.drawPageContent(doc, templatePage!.pageType);
          }
        }

        doc.end();
      };

      buildPages().catch(reject);
    });
  }

  private drawHeader(
    doc: InstanceType<typeof PDFDocument>,
    params: {
      qrBuffer: Buffer;
      studentName: string;
      className: string;
      unitName: string | null;
      schoolName: string;
      eventName: string;
      pageNum: number;
      pageType: PageType;
      totalPagesPerStudent: number;
    },
  ): void {
    const {
      qrBuffer,
      studentName,
      className,
      unitName,
      schoolName,
      eventName,
      pageNum,
      pageType,
      totalPagesPerStudent,
    } = params;

    // QR Code image
    doc.image(qrBuffer, QR_X, QR_Y, { width: QR_SIZE, height: QR_SIZE });

    // School/unit line
    const schoolLine = unitName ? `${schoolName} — ${unitName}` : schoolName;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111827')
      .text(studentName, TEXT_X, TEXT_Y_START, { lineBreak: false });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6b7280')
      .text(`Turma: ${className}`, TEXT_X, TEXT_Y_START + LINE_HEIGHT, {
        lineBreak: false,
      });

    doc.text(schoolLine, TEXT_X, TEXT_Y_START + LINE_HEIGHT * 2, {
      lineBreak: false,
    });

    doc.text(`Evento: ${eventName}`, TEXT_X, TEXT_Y_START + LINE_HEIGHT * 3, {
      lineBreak: false,
    });

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#374151')
      .text(
        `Página ${pageNum} de ${totalPagesPerStudent}${pageType === PageType.COVER ? ' (CAPA)' : ''}`,
        TEXT_X,
        TEXT_Y_START + LINE_HEIGHT * 4,
        { lineBreak: false },
      );

    // Separator line below header
    // const separatorY = PDF_MARGIN / 2 + HEADER_HEIGHT + 12;
    // doc
    //   .save()
    //   .moveTo(PDF_MARGIN / 2, separatorY)
    //   .lineTo(doc.page.width - PDF_MARGIN / 2, separatorY)
    //   .strokeColor('#e5e7eb')
    //   .stroke()
    //   .restore();
  }

  /**
   * Draws the editable area below the header depending on the page type:
   *   DRAW      → single horizontal line; the area below (a square) is the drawing space
   *   DRAW_TEXT → single horizontal line + writing lines below
   *   TEXT      → writing lines only
   *
   * For DRAW and DRAW_TEXT the line is drawn at CONTENT_TOP + squareSize so
   * that the region above it (height === squareSize === contentWidth) forms a
   * perfect square filling the full page width.
   */
  private drawPageContent(
    doc: InstanceType<typeof PDFDocument>,
    pageType: PageType,
  ): void {
    const contentLeft = PDF_MARGIN;
    const contentRight = doc.page.width - PDF_MARGIN;
    const contentWidth = contentRight - contentLeft;
    const contentBottom = doc.page.height - PDF_MARGIN;
    const contentHeight = contentBottom - CONTENT_TOP;

    if (
      pageType === PageType.DRAW ||
      pageType === PageType.DRAW_TEXT ||
      pageType === PageType.COVER
    ) {
      let squareSize: number;

      if (pageType === PageType.DRAW || pageType === PageType.COVER) {
        // The square occupies the full content width, so its height equals the
        // content width (making it a perfect square).
        squareSize = contentWidth;
      } else {
        // DRAW_TEXT: reserve space for writing lines below the square.
        const linesBlockHeight = TEXT_LINES_COUNT * WRITING_LINE_HEIGHT;
        const squareMaxHeight = contentHeight - linesBlockHeight - 24;
        squareSize = Math.min(contentWidth, squareMaxHeight);
      }

      // Draw only the bottom boundary of the square as a horizontal line that
      // spans the full content width. The space above this line (from
      // CONTENT_TOP down squareSize px) forms the drawing square.
      const lineY = CONTENT_TOP + squareSize;

      doc
        .save()
        .moveTo(0, doc.page.height - doc.page.width)
        .lineTo(doc.page.width, doc.page.height - doc.page.width)
        .strokeColor('#9ca3af')
        .lineWidth(1)
        .stroke()
        .restore();

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#374151')
        .text(
          `DESENHE APENAS ABAIXO DESTA LINHA`,
          0,
          doc.page.height - doc.page.width - 20,
          { lineBreak: false, align: 'center', width: doc.page.width },
        );

      if (pageType === PageType.DRAW_TEXT) {
        const linesStartY = lineY + 24;
        this.drawWritingLines(
          doc,
          contentLeft,
          linesStartY,
          contentWidth,
          TEXT_LINES_COUNT,
        );
      }

      if (pageType === PageType.COVER) {
        this.drawWritingLines(doc, contentLeft, 160, contentWidth, 1);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#374151')
          .text('TÍTULO:', contentLeft, 180);
      }
    } else if (pageType === PageType.TEXT) {
      this.drawWritingLines(
        doc,
        contentLeft,
        CONTENT_TOP,
        contentWidth,
        Math.floor(contentHeight / WRITING_LINE_HEIGHT),
      );
    }
  }

  /**
   * Draws horizontal writing lines. Each line is drawn at the *bottom* of its
   * slot so the child writes on top of the line (like ruled paper).
   */
  private drawWritingLines(
    doc: InstanceType<typeof PDFDocument>,
    x: number,
    startY: number,
    width: number,
    count: number,
  ): void {
    doc.save().strokeColor('#d1d5db').lineWidth(0.5);

    for (let i = 1; i <= count; i++) {
      const y = startY + i * WRITING_LINE_HEIGHT;
      doc
        .moveTo(x, y)
        .lineTo(x + width, y)
        .stroke();
    }

    doc.restore();
  }

  private drawBookTextPage(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    author: string,
    text: string,
    pageNumber: number,
  ): void {
    // Top line
    doc
      .moveTo(40, 70)
      .lineTo(595.28 - 40, 70)
      .lineWidth(2)
      .strokeColor('#0a3a60')
      .stroke();

    // Top Header Text
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0a3a60')
      .text(title, 40, 52, { lineBreak: false });

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0a3a60')
      .text(author, 40, 52, { align: 'right', width: 595.28 - 80 });

    // Text Content
    const contentWidth = 595.28 - 120; // Margin of 60 on left/right
    const availableHeight = 700; // between y=70 and y=770
    const textHeight = doc.heightOfString(text, {
      width: contentWidth,
      lineGap: 6,
    });
    const startY = 70 + (availableHeight - textHeight) / 2;

    doc
      .font('Helvetica')
      .fontSize(16)
      .fillColor('#1f2937')
      .text(text, 60, startY, {
        align: 'left',
        width: contentWidth,
        lineGap: 6,
      });

    // Bottom line
    doc
      .moveTo(40, 770)
      .lineTo(595.28 - 40, 770)
      .lineWidth(2)
      .strokeColor('#0a3a60')
      .stroke();

    // Page Number Oval
    const boxWidth = 32;
    const boxHeight = 20;
    const boxX = (595.28 - boxWidth) / 2;
    const boxY = 780;

    doc
      .roundedRect(boxX, boxY, boxWidth, boxHeight, 10)
      .lineWidth(1)
      .strokeColor('#0a3a60')
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#0a3a60')
      .text(pageNumber.toString(), boxX, boxY + 5, {
        align: 'center',
        width: boxWidth,
      });
  }

  private async drawBookDrawPage(
    doc: InstanceType<typeof PDFDocument>,
    drawImageUrl: string | null,
  ): Promise<void> {
    const drawSize = 450;
    const drawX = (595.28 - drawSize) / 2;
    const drawY = (841.89 - drawSize) / 2;

    // Border
    doc
      .rect(drawX, drawY, drawSize, drawSize)
      .lineWidth(2)
      .strokeColor('#0a3a60')
      .stroke();

    if (drawImageUrl) {
      try {
        const response = await globalThis.fetch(drawImageUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);
          doc.image(imageBuffer, drawX + 2, drawY + 2, {
            fit: [drawSize - 4, drawSize - 4],
            align: 'center',
            valign: 'center',
          });
        } else {
          console.error(
            `Failed to fetch image: status ${response.status} for URL ${drawImageUrl}`,
          );
          doc
            .font('Helvetica')
            .fontSize(14)
            .fillColor('#9ca3af')
            .text('Imagem não disponível', drawX, drawY + drawSize / 2 - 7, {
              align: 'center',
              width: drawSize,
            });
        }
      } catch (error) {
        console.error('Failed to fetch/draw page image:', error);
        doc
          .font('Helvetica')
          .fontSize(14)
          .fillColor('#9ca3af')
          .text('Imagem não disponível', drawX, drawY + drawSize / 2 - 7, {
            align: 'center',
            width: drawSize,
          });
      }
    } else {
      doc
        .font('Helvetica')
        .fontSize(14)
        .fillColor('#9ca3af')
        .text('Sem desenho', drawX, drawY + drawSize / 2 - 7, {
          align: 'center',
          width: drawSize,
        });
    }
  }

  async generateBookPdf(bookId: string, user: AuthUser): Promise<Buffer> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        student: {
          include: {
            class: {
              include: {
                units: true,
              },
            },
          },
        },
        pages: {
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!book) throw new NotFoundBookException();

    if (user.role !== UserRole.ADMIN)
      throw new ForbiddenUserNotAdminException();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
        autoFirstPage: false,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const render = async () => {
        const title = book.title || 'Sem Título';
        const author = (book.author || book.student.name).toUpperCase();

        for (const page of book.pages) {
          if (page.type === PageType.TEXT) {
            doc.addPage();
            this.drawBookTextPage(
              doc,
              title,
              author,
              page.textContent || '',
              page.number,
            );
          } else if (page.type === PageType.DRAW) {
            doc.addPage();
            await this.drawBookDrawPage(doc, page.drawImageUrl);
          }
        }
        doc.end();
      };

      render().catch(reject);
    });
  }

  private async generateBookCoverPdf(bookId: string): Promise<Buffer> {
    throw new BadRequestException('Método não implementado');
  }

  private async generateBookPagePdf(pageId: string): Promise<Buffer> {
    const [bookId, pageNumberStr] = pageId.split('_');
    if (!bookId || !pageNumberStr) {
      throw new BadRequestException(
        'Formato de pageId inválido. Use "bookId_pageNumber"',
      );
    }
    const pageNumber = parseInt(pageNumberStr, 10);
    if (isNaN(pageNumber)) {
      throw new BadRequestException('Número da página inválido');
    }

    const page = await this.prisma.page.findUnique({
      where: {
        bookId_number: {
          bookId,
          number: pageNumber,
        },
      },
      include: {
        book: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundPdfPageException();
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
        autoFirstPage: false,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const render = async () => {
        const title = page.book.title || 'Sem Título';
        const author = (
          page.book.author || page.book.student.name
        ).toUpperCase();

        doc.addPage();
        if (page.type === PageType.TEXT) {
          this.drawBookTextPage(
            doc,
            title,
            author,
            page.textContent || '',
            page.number,
          );
        } else if (page.type === PageType.DRAW) {
          await this.drawBookDrawPage(doc, page.drawImageUrl);
        } else {
          doc
            .font('Helvetica')
            .fontSize(12)
            .fillColor('#000000')
            .text(`Página ${page.number}`, 40, 40);
        }
        doc.end();
      };

      render().catch(reject);
    });
  }
}
