import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { AuthUser, UserRole } from '@repo/shared';
import {
  AuthographsEventStatus,
  BookStatus,
  PageType,
  Prisma,
} from '@prisma/client';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLibDocument, rgb } from 'pdf-lib';
import { NotFoundBookException } from '../books/books.errors.js';
import {
  ConflictMoreThanOneActiveEventException,
  NotFoundPdfClassException,
  NotFoundPdfNoActiveEventException,
  NotFoundPdfNoEligiblePagesException,
  NotFoundPdfNoStudentsException,
  NotFoundCoverException,
  BadRequestMissingCoverDrawingException,
  BadRequestMissingBiographyException,
  NotFoundCoverTemplateException,
  NotFoundLogoException,
} from './pdf.errors.js';
import {
  BadRequestBookIsNotReadyException,
  ForbiddenUserNotAdminException,
} from '../users/users.errors.js';
import { getKeyFromUrl } from '../common/bucket/bucket.utils.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';

const require = createRequire(import.meta.url);
const fontkit = require('@pdf-lib/fontkit');

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

const parseHexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
};

@Injectable()
export class PdfService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
  ) {}

  private getFontPath(fontName: string): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    let fontPath = path.join(
      __dirname,
      '../../../../packages/shared/fonts',
      fontName,
    );
    if (fs.existsSync(fontPath)) return fontPath;

    fontPath = path.join(
      process.cwd(),
      '../../packages/shared/fonts',
      fontName,
    );
    if (fs.existsSync(fontPath)) return fontPath;

    fontPath = path.join(process.cwd(), 'packages/shared/fonts', fontName);
    if (fs.existsSync(fontPath)) return fontPath;

    throw new Error(`Font file not found: ${fontName}`);
  }

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

  private drawPageNumber(
    doc: InstanceType<typeof PDFDocument>,
    pageNumber: number,
    colorTheme: string,
  ): void {
    const MM_TO_PT = 72 / 25.4;
    const pageSize = 205 * MM_TO_PT;
    const bottomY = 190 * MM_TO_PT;
    const textY = bottomY + 12;

    doc.save();

    doc
      .font('MyriadPro-Semibold')
      .fontSize(10)
      .fillColor(colorTheme)
      .text(pageNumber.toString(), 0, textY, {
        align: 'center',
        width: pageSize,
      });

    doc.restore();
  }

  private drawBookTextPage(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    author: string,
    text: string,
    pageNumber: number,
    colorTheme: string,
  ): void {
    const MM_TO_PT = 72 / 25.4;
    const pageSize = 205 * MM_TO_PT;
    const topY = 15 * MM_TO_PT;
    const bottomY = 190 * MM_TO_PT;
    const startX = 15 * MM_TO_PT;
    const endX = 190 * MM_TO_PT;
    const lineLength = 175 * MM_TO_PT;

    // Top line
    doc
      .moveTo(startX, topY)
      .lineTo(endX, topY)
      .lineWidth(2)
      .strokeColor(colorTheme)
      .stroke();

    // Top Header Text (just below the top line)
    const headerY = topY + 10;
    doc
      .font('MyriadPro-Semibold')
      .fontSize(12)
      .fillColor(colorTheme)
      .text(title, startX, headerY, { lineBreak: false });

    doc
      .font('MyriadPro-Semibold')
      .fontSize(12)
      .fillColor(colorTheme)
      .text(author, startX, headerY, { align: 'right', width: lineLength });

    // Text Content
    const contentWidth = pageSize - 120; // Margin of 60 on left/right
    const contentTopY = topY + 30; // start below header text
    const contentBottomY = bottomY - 10;
    const availableHeight = contentBottomY - contentTopY;
    const textHeight = doc.heightOfString(text, {
      width: contentWidth,
      lineGap: 6,
    });
    const startY = contentTopY + (availableHeight - textHeight) / 2;

    doc
      .font('MyriadPro')
      .fontSize(16)
      .fillColor('#1f2937')
      .text(text, 60, startY, {
        align: 'left',
        width: contentWidth,
        lineGap: 6,
      });

    // Bottom line
    doc
      .moveTo(startX, bottomY)
      .lineTo(endX, bottomY)
      .lineWidth(2)
      .strokeColor(colorTheme)
      .stroke();

    // Page Number
    this.drawPageNumber(doc, pageNumber, colorTheme);
  }

  private async drawBookDrawPage(
    doc: InstanceType<typeof PDFDocument>,
    drawImageUrl: string | null,
    pageNumber: number,
    colorTheme: string,
  ): Promise<void> {
    const MM_TO_PT = 72 / 25.4;
    const drawSize = 175 * MM_TO_PT;
    const drawX = 15 * MM_TO_PT;
    const drawY = 15 * MM_TO_PT;

    if (drawImageUrl) {
      try {
        const response = await globalThis.fetch(drawImageUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);
          doc.image(imageBuffer, drawX, drawY, {
            fit: [drawSize, drawSize],
            align: 'center',
            valign: 'center',
          });
        } else {
          console.error(
            `Failed to fetch image: status ${response.status} for URL ${drawImageUrl}`,
          );
          doc
            .font('MyriadPro')
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
          .font('MyriadPro')
          .fontSize(14)
          .fillColor('#9ca3af')
          .text('Imagem não disponível', drawX, drawY + drawSize / 2 - 7, {
            align: 'center',
            width: drawSize,
          });
      }
    } else {
      doc
        .font('MyriadPro')
        .fontSize(14)
        .fillColor('#9ca3af')
        .text('Sem desenho', drawX, drawY + drawSize / 2 - 7, {
          align: 'center',
          width: drawSize,
        });
    }

    // Top and bottom borders (horizontal blue lines only) - Drawn on top of the image to preserve full line thickness
    doc
      .save()
      .lineWidth(2)
      .strokeColor(colorTheme)
      .moveTo(drawX, drawY)
      .lineTo(drawX + drawSize, drawY)
      .moveTo(drawX, drawY + drawSize)
      .lineTo(drawX + drawSize, drawY + drawSize)
      .stroke()
      .restore();

    // Page Number
    this.drawPageNumber(doc, pageNumber, colorTheme);
  }

  private async drawBookPrefacePage(
    doc: InstanceType<typeof PDFDocument>,
    classRecord: Prisma.ClassGetPayload<{
      include: {
        units: true;
      };
    }>,
    title: string,
    author: string,
    colorTheme: string,
  ): Promise<void> {
    const MM_TO_PT = 72 / 25.4;
    const pageSize = 205 * MM_TO_PT;
    const topY = 15 * MM_TO_PT;
    const bottomY = 190 * MM_TO_PT;
    const startX = 15 * MM_TO_PT;
    const endX = 190 * MM_TO_PT;

    // 1. Draw top & bottom lines
    doc
      .save()
      .moveTo(startX, topY)
      .lineTo(endX, topY)
      .moveTo(startX, bottomY)
      .lineTo(endX, bottomY)
      .lineWidth(2)
      .strokeColor(colorTheme)
      .stroke()
      .restore();

    // 2. Draw School Logo
    const schoolLogoUrl = classRecord.units?.logoUrl;
    if (schoolLogoUrl) {
      try {
        const response = await globalThis.fetch(schoolLogoUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const logoBuffer = Buffer.from(arrayBuffer);

          doc.image(logoBuffer, 0, topY + 10, {
            fit: [pageSize, 50],
            align: 'center',
            valign: 'center',
          });
        }
      } catch (err) {
        console.error('Failed to draw school logo in preface page:', err);
      }
    }

    // 3. Draw Text Genre
    const genreText = classRecord.bookGenre || '';
    const genreY = topY + 70;
    doc
      .font('MyriadPro-Semibold')
      .fontSize(18)
      .fillColor(colorTheme)
      .text(genreText, 0, genreY, {
        align: 'center',
        width: pageSize,
      });

    // 4. Draw Explanation
    const explanationText = classRecord.bookGenreExplanation || '';
    const explanationY = genreY + 30;
    doc
      .font('MyriadPro')
      .fontSize(12)
      .fillColor('#1f2937')
      .text(explanationText, 30, explanationY, {
        align: 'center',
        width: pageSize - 60,
        lineGap: 4,
      });

    // 5. Draw Book Title
    const titleY = bottomY - 110;
    doc
      .font('MyriadPro-Semibold')
      .fontSize(22)
      .fillColor('#1f2937')
      .text(title, 0, titleY, {
        align: 'center',
        width: pageSize,
      });

    // 6. Draw Author
    const authorRoleY = titleY + 35;
    doc
      .font('MyriadPro')
      .fontSize(11)
      .fillColor('#4b5563')
      .text('Escrito e ilustrado por', 0, authorRoleY, {
        align: 'center',
        width: pageSize,
      });

    const authorNameY = authorRoleY + 15;
    doc
      .font('MyriadPro-It')
      .fontSize(12)
      .fillColor('#1f2937')
      .text(author.toUpperCase(), 0, authorNameY, {
        align: 'center',
        width: pageSize,
      });

    // 7. Draw Publisher Info
    const pubY = bottomY - 38;
    doc
      .font('MyriadPro-Semibold')
      .fontSize(12)
      .fillColor('#b91c1c')
      .text('MAGNA', 0, pubY, {
        align: 'center',
        width: pageSize,
      });

    doc
      .font('MyriadPro-Semibold')
      .fontSize(12)
      .fillColor('#4b5563')
      .text('PRINTI', 0, pubY + 11, {
        align: 'center',
        width: pageSize,
      });

    doc
      .font('MyriadPro')
      .fontSize(7)
      .fillColor('#9ca3af')
      .text('conveniência gráfica', 0, pubY + 23, {
        align: 'center',
        width: pageSize,
      });

    const yearText = classRecord.schoolYear
      ? classRecord.schoolYear.replace('YEAR_', '')
      : new Date().getFullYear().toString();
    doc
      .font('MyriadPro-Semibold')
      .fontSize(8)
      .fillColor('#4b5563')
      .text(yearText, 0, pubY + 31, {
        align: 'center',
        width: pageSize,
      });
  }

  private async drawBookThanksPage(
    doc: InstanceType<typeof PDFDocument>,
    classRecord: Prisma.ClassGetPayload<{
      include: {
        units: true;
      };
    }>,
    pageNumber: number,
    colorTheme: string,
  ): Promise<void> {
    const MM_TO_PT = 72 / 25.4;
    const pageSize = 205 * MM_TO_PT;
    const topY = 15 * MM_TO_PT;
    const bottomY = 190 * MM_TO_PT;
    const startX = 15 * MM_TO_PT;
    const endX = 190 * MM_TO_PT;

    // 1. Draw top line only
    doc
      .save()
      .moveTo(startX, topY)
      .lineTo(endX, topY)
      .lineWidth(2)
      .strokeColor(colorTheme)
      .stroke()
      .restore();

    // 2. Draw School Logo
    const schoolLogoUrl = classRecord.units?.logoUrl;
    if (schoolLogoUrl) {
      try {
        const response = await globalThis.fetch(schoolLogoUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const logoBuffer = Buffer.from(arrayBuffer);
          doc.image(logoBuffer, 0, topY + 10, {
            fit: [pageSize, 50],
            align: 'center',
            valign: 'center',
          });
        }
      } catch (err) {
        console.error('Failed to draw school logo in thanks page:', err);
      }
    }

    // 3. Draw School Message if present
    const schoolMsgText = classRecord.schoolMessage || '';
    const schoolMsgY = topY + 65;
    let schoolMsgHeight = 0;
    if (schoolMsgText) {
      doc
        .font('MyriadPro')
        .fontSize(12)
        .fillColor('#1f2937')
        .text(schoolMsgText, startX, schoolMsgY, {
          align: 'center',
          width: endX - startX,
          lineGap: 4,
        });
      schoolMsgHeight =
        doc.heightOfString(schoolMsgText, {
          width: endX - startX,
          lineGap: 4,
        }) + 15;
    }

    // 4. Draw Title: "Agradecimentos"
    const titleY = schoolMsgY + schoolMsgHeight;
    doc
      .font('MyriadPro-Semibold')
      .fontSize(15)
      .fillColor(colorTheme)
      .text('Agradecimentos', 0, titleY, {
        align: 'center',
        width: pageSize,
      });

    // 5. Draw Thanks Message
    const thanksText = classRecord.thanksMessage || '';
    const thanksY = titleY + 25;
    doc
      .font('MyriadPro')
      .fontSize(12)
      .fillColor('#1f2937')
      .text(thanksText, startX, thanksY, {
        align: 'center',
        width: endX - startX,
        lineGap: 4,
      });

    const thanksHeight = doc.heightOfString(thanksText, {
      width: endX - startX,
      lineGap: 4,
    });

    // Draw horizontal separator line under thanks message
    const separatorY = thanksY + thanksHeight + 15;
    doc
      .save()
      .moveTo(startX, separatorY)
      .lineTo(endX, separatorY)
      .lineWidth(1)
      .strokeColor(colorTheme)
      .stroke()
      .restore();

    // 6. Draw School Team (Staff List)
    const staffStartY = separatorY + 15;
    const staffLines = (classRecord.schoolTeam || '')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    const staffItems: { role: string; name: string }[] = [];
    for (const line of staffLines) {
      const parts = line.split(':');
      const firstPart = parts[0];
      if (parts.length >= 2 && firstPart !== undefined) {
        staffItems.push({
          role: firstPart.trim(),
          name: parts.slice(1).join(':').trim(),
        });
      } else {
        staffItems.push({
          role: '',
          name: line.trim(),
        });
      }
    }

    const colWidth = pageSize / 2 - startX - 10;
    const leftColX = startX;
    const rightColX = pageSize / 2 + 10;

    const hasCenterItem = staffItems.length % 2 !== 0;
    const sideItemsCount = hasCenterItem
      ? staffItems.length - 1
      : staffItems.length;

    let leftY = staffStartY;
    let rightY = staffStartY;

    for (let idx = 0; idx < sideItemsCount; idx++) {
      const item = staffItems[idx]!;
      const isLeft = idx % 2 === 0;
      const x = isLeft ? leftColX : rightColX;
      const y = isLeft ? leftY : rightY;

      if (item.role) {
        doc
          .font('MyriadPro-It')
          .fontSize(12)
          .fillColor(colorTheme)
          .text(item.role, x, y, { align: 'left', width: colWidth });
        doc
          .font('MyriadPro')
          .fontSize(12)
          .fillColor('#1f2937')
          .text(item.name, x, y + 14, { align: 'left', width: colWidth });
      } else {
        doc
          .font('MyriadPro')
          .fontSize(12)
          .fillColor('#1f2937')
          .text(item.name, x, y, { align: 'left', width: colWidth });
      }

      if (isLeft) {
        leftY += item.role ? 36 : 18;
      } else {
        rightY += item.role ? 36 : 18;
      }
    }

    const finalStaffY = Math.max(leftY, rightY);

    if (hasCenterItem) {
      const lastItem = staffItems[staffItems.length - 1]!;
      const y = finalStaffY + 5;
      if (lastItem.role) {
        doc
          .font('MyriadPro-It')
          .fontSize(12)
          .fillColor(colorTheme)
          .text(lastItem.role, 0, y, { align: 'center', width: pageSize });
        doc
          .font('MyriadPro')
          .fontSize(12)
          .fillColor('#1f2937')
          .text(lastItem.name, 0, y + 14, { align: 'center', width: pageSize });
      } else {
        doc
          .font('MyriadPro')
          .fontSize(12)
          .fillColor('#1f2937')
          .text(lastItem.name, 0, y, { align: 'center', width: pageSize });
      }
    }

    // 6. Draw Page Number Pill
    const pillY = bottomY + 12;
    const pageNumText = pageNumber.toString();

    doc.save();
    // Draw pill border
    doc
      .roundedRect(pageSize / 2 - 18, pillY - 4, 36, 16, 8)
      .lineWidth(0.5)
      .strokeColor('#d1d5db')
      .stroke();

    // Draw text inside pill
    doc
      .font('MyriadPro-Semibold')
      .fontSize(9)
      .fillColor(colorTheme)
      .text(pageNumText, 0, pillY, {
        align: 'center',
        width: pageSize,
      });
    doc.restore();
  }

  private drawCropMarks(
    doc: InstanceType<typeof PDFDocument>,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    MM_TO_PT: number,
  ): void {
    const offset = 2 * MM_TO_PT;
    const length = 5 * MM_TO_PT;

    doc.save().strokeColor('#000000').lineWidth(0.5);

    // Top-Left Corner
    doc
      .moveTo(x1 - offset, y1)
      .lineTo(x1 - offset - length, y1)
      .stroke();
    doc
      .moveTo(x1, y1 - offset)
      .lineTo(x1, y1 - offset - length)
      .stroke();

    // Top-Right Corner
    doc
      .moveTo(x2 + offset, y1)
      .lineTo(x2 + offset + length, y1)
      .stroke();
    doc
      .moveTo(x2, y1 - offset)
      .lineTo(x2, y1 - offset - length)
      .stroke();

    // Bottom-Left Corner
    doc
      .moveTo(x1 - offset, y2)
      .lineTo(x1 - offset - length, y2)
      .stroke();
    doc
      .moveTo(x1, y2 + offset)
      .lineTo(x1, y2 + offset + length)
      .stroke();

    // Bottom-Right Corner
    doc
      .moveTo(x2 + offset, y2)
      .lineTo(x2 + offset + length, y2)
      .stroke();
    doc
      .moveTo(x2, y2 + offset)
      .lineTo(x2, y2 + offset + length)
      .stroke();

    doc.restore();
  }

  async generateBookInteriorPdf(
    bookId: string,
    user: AuthUser,
  ): Promise<Buffer> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        student: {
          include: {
            class: {
              include: {
                bookTemplate: { include: { bookTemplateTheme: true } },
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

    const forbiddenBookStatuses: BookStatus[] = [
      BookStatus.DRAFT,
      BookStatus.REVISED_BY_SCHOOL,
    ];

    if (forbiddenBookStatuses.includes(book.status)) {
      throw new BadRequestBookIsNotReadyException();
    }

    const MM_TO_PT = 72 / 25.4;
    const originalWidth = 415 * MM_TO_PT;
    const originalHeight = 205 * MM_TO_PT;
    const totalWidth = 430.6 * MM_TO_PT;
    const totalHeight = 225.5 * MM_TO_PT;
    const squareSize = 205 * MM_TO_PT;
    const gap = 5 * MM_TO_PT;

    const offsetX = (totalWidth - originalWidth) / 2;
    const offsetY = (totalHeight - originalHeight) / 2;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [totalWidth, totalHeight],
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
        // Register custom fonts on the doc (PDFDocument from pdfkit)
        const regularFontPath = this.getFontPath('MyriadPro-Regular.ttf');
        const semiboldFontPath = this.getFontPath('MyriadPro-Semibold.ttf');
        const italicFontPath = this.getFontPath('MyriadPro-It.otf');
        doc.registerFont('MyriadPro', regularFontPath);
        doc.registerFont('MyriadPro-Semibold', semiboldFontPath);
        doc.registerFont('MyriadPro-It', italicFontPath);

        const colorTheme =
          book.student.class.bookTemplate.bookTemplateTheme.colorTheme;

        const title = book.title || 'Sem Título';
        const author = book.author || book.student.name;
        const totalPages = book.pages.length;
        const half = Math.ceil(totalPages / 2);

        for (let i = 0; i < half; i++) {
          let leftPage: (typeof book.pages)[0] | undefined;
          let rightPage: (typeof book.pages)[0] | undefined;
          // Even pages are always on the left and odd pages are always on the right
          if (i % 2 === 0) {
            leftPage = book.pages[i];
            rightPage = book.pages[totalPages - 1 - i];
          } else {
            leftPage = book.pages[totalPages - 1 - i];
            rightPage = book.pages[i];
          }

          if (!leftPage || !rightPage) continue;

          const notInteriorPageTypes: PageType[] = [
            PageType.COVER,
            PageType.BACK_COVER,
          ];

          if (
            notInteriorPageTypes.includes(leftPage.type) &&
            notInteriorPageTypes.includes(rightPage.type)
          )
            continue;

          doc.addPage();

          // Draw left page
          if (leftPage) {
            doc.save();
            doc.translate(offsetX, offsetY);
            if (leftPage.type === PageType.TEXT) {
              this.drawBookTextPage(
                doc,
                title,
                author,
                leftPage.textContent || '',
                leftPage.number,
                colorTheme,
              );
            } else if (leftPage.type === PageType.DRAW) {
              await this.drawBookDrawPage(
                doc,
                leftPage.drawImageUrl,
                leftPage.number,
                colorTheme,
              );
            } else if (leftPage.type === PageType.PREFACE) {
              await this.drawBookPrefacePage(
                doc,
                book.student.class,
                title,
                author,
                colorTheme,
              );
            } else if (leftPage.type === PageType.THANKS) {
              await this.drawBookThanksPage(
                doc,
                book.student.class,
                leftPage.number,
                colorTheme,
              );
            }
            doc.restore();
          }

          // Draw right page if not the same as left page
          if (rightPage && totalPages - 1 - i !== i) {
            doc.save();
            doc.translate(offsetX + squareSize + gap, offsetY);
            if (rightPage.type === PageType.TEXT) {
              this.drawBookTextPage(
                doc,
                title,
                author,
                rightPage.textContent || '',
                rightPage.number,
                colorTheme,
              );
            } else if (rightPage.type === PageType.DRAW) {
              await this.drawBookDrawPage(
                doc,
                rightPage.drawImageUrl,
                rightPage.number,
                colorTheme,
              );
            } else if (rightPage.type === PageType.PREFACE) {
              await this.drawBookPrefacePage(
                doc,
                book.student.class,
                title,
                author,
                colorTheme,
              );
            } else if (rightPage.type === PageType.THANKS) {
              await this.drawBookThanksPage(
                doc,
                book.student.class,
                rightPage.number,
                colorTheme,
              );
            }
            doc.restore();
          }

          // Draw crop marks for the outer boundary of the original size (415x205 mm)
          this.drawCropMarks(
            doc,
            offsetX,
            offsetY,
            offsetX + originalWidth,
            offsetY + originalHeight,
            MM_TO_PT,
          );
        }
        doc.end();
      };

      render().catch(reject);
    });
  }

  async generateBookCoverPdf(bookId: string): Promise<Buffer> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        student: {
          include: {
            class: {
              include: {
                units: true,
                bookTemplate: {
                  include: {
                    bookTemplateTheme: true,
                  },
                },
              },
            },
          },
        },
        pages: true,
      },
    });

    if (!book) throw new NotFoundBookException();

    // 1. Find the cover page
    const coverPage = book.pages.find((p) => p.type === PageType.COVER);
    if (!coverPage) throw new NotFoundCoverException();

    const coverImageUrl = coverPage.drawImageUrl;
    if (!coverImageUrl) throw new BadRequestMissingCoverDrawingException();

    // 2. Find the back cover page (for biography text and portrait photo)
    const backCoverPage = book.pages.find(
      (p) => p.type === PageType.BACK_COVER,
    );
    if (!backCoverPage) throw new NotFoundCoverException();

    // Biography text comes from backCoverPage textContent and portrait image from backCoverPage drawImageUrl
    const biographyText = backCoverPage.textContent;
    if (!biographyText || !biographyText.trim())
      throw new BadRequestMissingBiographyException();

    const portraitImageUrl = backCoverPage.drawImageUrl;
    if (!portraitImageUrl) throw new BadRequestMissingCoverDrawingException();

    const bookThemePdfKey = getKeyFromUrl(
      book.student.class.bookTemplate.bookTemplateTheme.coverThemePdfUrl,
    );

    // 3. Load background template
    // TODO: get the correct cover template based on the theme selected by the user
    const templateBuffer = await this.bucketService.get(bookThemePdfKey);

    if (!templateBuffer || templateBuffer.length === 0)
      throw new NotFoundCoverTemplateException();

    const pdfDoc = await PdfLibDocument.load(templateBuffer);
    pdfDoc.registerFontkit(fontkit);
    const page = pdfDoc.getPages()[0]!;
    const { height } = page.getSize();

    // Embed fonts using class helper
    const semiboldFontBuffer = fs.readFileSync(
      this.getFontPath('MyriadPro-Semibold.ttf'),
    );
    const regularFontBuffer = fs.readFileSync(
      this.getFontPath('MyriadPro-Regular.ttf'),
    );

    const myriadSemibold = await pdfDoc.embedFont(semiboldFontBuffer, {
      subset: true,
    });
    const myriadRegular = await pdfDoc.embedFont(regularFontBuffer, {
      subset: true,
    });

    // Horizontal center based on the cover drawing frame (not the geometric center of the front cover)
    // Cover Frame: Left = 785.28 pt, Width = 363.84 pt
    const coverCenterX = 785.28 + 363.84 / 2; // 967.2 pt

    // 4. Draw School Logo (Centered horizontally on cover drawing frame)
    const schoolLogoUrl = book.student.class.units.logoUrl;
    if (!schoolLogoUrl) throw new NotFoundLogoException();

    try {
      const logoKey = getKeyFromUrl(schoolLogoUrl);
      const logoBuffer = await this.bucketService.get(logoKey);
      console.log({ logoKey, logoBuffer });
      if (!logoBuffer || logoBuffer.length === 0) {
        throw new NotFoundLogoException();
      }
      const isPng =
        logoBuffer[0] === 0x89 &&
        logoBuffer[1] === 0x50 &&
        logoBuffer[2] === 0x4e &&
        logoBuffer[3] === 0x47;
      const logoImage = isPng
        ? await pdfDoc.embedPng(logoBuffer)
        : await pdfDoc.embedJpg(logoBuffer);

      const { width: logoImgW, height: logoImgH } = logoImage.scale(1);
      const logoMaxWidth = 120;
      const logoMaxHeight = 50;
      const logoScale = Math.min(
        logoMaxWidth / logoImgW,
        logoMaxHeight / logoImgH,
      );
      const logoWidth = logoImgW * logoScale;
      const logoHeight = logoImgH * logoScale;

      const logoX = coverCenterX - logoWidth / 2;
      const logoY = height - 65 - logoHeight; // top = 65 pt

      page.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
      });
    } catch (err) {
      console.error('Failed to embed school logo:', err);
    }

    // 5. Draw Cover Image inside the pre-existing white frame
    // Inner frame: Left = 785.28 pt, Top = 181.44 pt, Width = 363.84 pt, Height = 322.08 pt
    const coverImageKey = getKeyFromUrl(coverImageUrl);
    const coverBuffer = await this.bucketService.get(coverImageKey);
    if (!coverBuffer) throw new NotFoundCoverException();

    const isCoverPng =
      coverBuffer[0] === 0x89 &&
      coverBuffer[1] === 0x50 &&
      coverBuffer[2] === 0x4e &&
      coverBuffer[3] === 0x47;
    const coverImage = isCoverPng
      ? await pdfDoc.embedPng(coverBuffer)
      : await pdfDoc.embedJpg(coverBuffer);

    const { width: drawImgW, height: drawImgH } = coverImage.scale(1);
    const coverMaxWidth = 363.84;
    const coverMaxHeight = 322.08;
    const coverScale = Math.min(
      coverMaxWidth / drawImgW,
      coverMaxHeight / drawImgH,
    );
    const drawWidth = drawImgW * coverScale;
    const drawHeight = drawImgH * coverScale;

    const drawX = 785.28 + (coverMaxWidth - drawWidth) / 2;
    const drawY =
      height - 181.44 - coverMaxHeight + (coverMaxHeight - drawHeight) / 2;

    page.drawImage(coverImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });

    // 6. Draw Student Portrait Photo (if available) inside pre-existing frame
    // Tilted counter-clockwise. Rectangle 5: Left = 88.80 pt, Top = 217.44 pt, Width = 164.64 pt, Height = 233.76 pt
    let hasPortrait = false;
    try {
      const portraitImageKey = getKeyFromUrl(portraitImageUrl);
      const portraitBuffer = await this.bucketService.get(portraitImageKey);
      if (!portraitBuffer) throw new BadRequestMissingCoverDrawingException();

      const isPortraitPng =
        portraitBuffer[0] === 0x89 &&
        portraitBuffer[1] === 0x50 &&
        portraitBuffer[2] === 0x4e &&
        portraitBuffer[3] === 0x47;
      const portraitImage = isPortraitPng
        ? await pdfDoc.embedPng(portraitBuffer)
        : await pdfDoc.embedJpg(portraitBuffer);

      const { width: imgW, height: imgH } = portraitImage.scale(1);
      const frameWidth = 164.64;
      const frameHeight = 233.76;
      const scale = Math.min(frameWidth / imgW, frameHeight / imgH);
      const finalWidth = imgW * scale;
      const finalHeight = imgH * scale;

      const photoX = 88.8 + (frameWidth - finalWidth) / 2;
      const photoY =
        height - 217.44 - frameHeight + (frameHeight - finalHeight) / 2;

      page.drawImage(portraitImage, {
        x: photoX,
        y: photoY,
        width: finalWidth,
        height: finalHeight,
      });
      hasPortrait = true;
    } catch (err) {
      console.error('Failed to embed student portrait photo:', err);
    }

    // 7. Draw Biography Text (Myriad Pro Regular size between 14 and 20, depending on text length)
    const bioColor = rgb(31 / 255, 41 / 255, 55 / 255); // #1f2937

    // Wrapping rules helper to check if a font size fits
    const getBioLayout = (fontSize: number) => {
      const wordsList = biographyText.split(/\s+/);
      const lineHeight = Math.round(fontSize * 1.35);
      let testY = 227;
      const lines: Array<{ text: string; x: number; y: number }> = [];
      let lineWords: string[] = [];

      for (let i = 0; i < wordsList.length; i++) {
        const word = wordsList[i]!;
        const isOverlappingPhoto = hasPortrait && testY < 450;
        const maxLineWidth = isOverlappingPhoto ? 247 : 338;

        const testLine = [...lineWords, word].join(' ');
        const testWidth = myriadSemibold.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxLineWidth && lineWords.length > 0) {
          const lineText = lineWords.join(' ');
          const xStart = isOverlappingPhoto ? 265 : 174.24;
          lines.push({
            text: lineText,
            x: xStart,
            y: height - testY - fontSize,
          });
          testY += lineHeight;
          lineWords = [word];
        } else {
          lineWords.push(word);
        }
      }

      if (lineWords.length > 0) {
        const isOverlappingPhoto = hasPortrait && testY < 450;
        const xStart = isOverlappingPhoto ? 265 : 174.24;
        lines.push({
          text: lineWords.join(' '),
          x: xStart,
          y: height - testY - fontSize,
        });
        testY += lineHeight;
      }

      return { lines, finalY: testY };
    };

    // Find the largest font size between 14 and 20 that fits without overlapping the magnific code (Y <= 540)
    let chosenFontSize = 14;
    let bioLayout = getBioLayout(chosenFontSize);

    for (let size = 18; size >= 14; size--) {
      const testLayout = getBioLayout(size);
      if (testLayout.finalY <= 540) {
        chosenFontSize = size;
        bioLayout = testLayout;
        break;
      }
    }

    const bioHeight = bioLayout.finalY - 227;
    const targetStartY = Math.max(227, 334.32 - bioHeight / 2);
    const yOffset = targetStartY - 227;

    // Draw the calculated biography lines
    for (const line of bioLayout.lines) {
      page.drawText(line.text, {
        x: line.x,
        y: line.y - yOffset,
        size: chosenFontSize,
        font: myriadSemibold,
        color: bioColor,
      });
    }

    // 8. Draw Book Title, description, and Student Name (Bottom of front cover)
    // Título da Obra - Myriad Pro Semi bold 24pt
    const titleText = book.title || 'Sem Título';
    const titleFontSize = 24;
    const titleY = height - 553.7 - titleFontSize;
    const titleWidth = myriadSemibold.widthOfTextAtSize(
      titleText,
      titleFontSize,
    );

    const colorTheme =
      book.student.class.bookTemplate.bookTemplateTheme.colorTheme;
    const themeColorRgb = parseHexToRgb(colorTheme);

    // Book title
    page.drawText(titleText, {
      x: coverCenterX - titleWidth / 2,
      y: titleY,
      size: titleFontSize,
      font: myriadSemibold,
      color: themeColorRgb,
    });

    // Nome do Autor - Myriad Pro Regular 22pt
    const nameText = (book.author || book.student.name).toUpperCase();
    const nameFontSize = 20;
    const nameY = height - 590 - nameFontSize;
    const nameWidth = myriadRegular.widthOfTextAtSize(nameText, nameFontSize);
    page.drawText(nameText, {
      x: coverCenterX - nameWidth / 2,
      y: nameY,
      size: nameFontSize,
      font: myriadRegular,
      color: themeColorRgb,
    });

    // 9. Draw magnificCode (Bottom of back cover)
    const codeText = book.magnificCode;
    const codeX = 501;
    const codeY1 = height - 551 - 10;
    const codeY2 = height - 566 - 11;

    page.drawText('Código', {
      x: codeX,
      y: codeY1,
      size: 10,
      font: myriadSemibold,
      color: rgb(31 / 255, 41 / 255, 55 / 255),
    });

    page.drawText(codeText.toUpperCase(), {
      x: codeX,
      y: codeY2,
      size: 11,
      font: myriadSemibold,
      color: rgb(31 / 255, 41 / 255, 55 / 255),
    });

    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes);
  }
}
