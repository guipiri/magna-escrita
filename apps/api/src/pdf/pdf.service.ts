import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { AuthUser, UserRole } from '@repo/shared';
import { AuthographsEventStatus, BookStatus, PageType } from '@prisma/client';
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
import { ForbiddenUserNotAdminException } from '../users/users.errors.js';
import { getKeyFromUrl } from '../common/bucket/bucket.utils.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';

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
  constructor(
    private readonly prisma: PrismaService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
  ) {}

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
      .strokeColor('#0a3a60')
      .stroke();

    // Top Header Text (just below the top line)
    const headerY = topY + 10;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0a3a60')
      .text(title, startX, headerY, { lineBreak: false });

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0a3a60')
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
      .moveTo(startX, bottomY)
      .lineTo(endX, bottomY)
      .lineWidth(2)
      .strokeColor('#0a3a60')
      .stroke();

    // Page Number Oval
    const boxWidth = 32;
    const boxHeight = 20;
    const boxX = (pageSize - boxWidth) / 2;
    const boxY = bottomY + (pageSize - bottomY - boxHeight) / 2;

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
    pageNumber: number,
  ): Promise<void> {
    const MM_TO_PT = 72 / 25.4;
    const pageSize = 205 * MM_TO_PT;
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

    // Top and bottom borders (horizontal blue lines only) - Drawn on top of the image to preserve full line thickness
    doc
      .save()
      .lineWidth(2)
      .strokeColor('#0a3a60')
      .moveTo(drawX, drawY)
      .lineTo(drawX + drawSize, drawY)
      .moveTo(drawX, drawY + drawSize)
      .lineTo(drawX + drawSize, drawY + drawSize)
      .stroke()
      .restore();

    // Page Number Oval
    const boxWidth = 32;
    const boxHeight = 20;
    const boxX = (pageSize - boxWidth) / 2;
    const boxY =
      drawY + drawSize + (pageSize - (drawY + drawSize) - boxHeight) / 2;

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
      throw new BadRequestException('Book is not ready for PDF generation');
    }

    const MM_TO_PT = 72 / 25.4;
    const totalWidth = 415 * MM_TO_PT;
    const totalHeight = 205 * MM_TO_PT;
    const squareSize = 205 * MM_TO_PT;
    const gap = 5 * MM_TO_PT;

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
        const title = book.title || 'Sem Título';
        const author = book.author || book.student.name;
        const totalPages = book.pages.length;
        const half = Math.ceil(totalPages / 2);

        for (let i = 0; i < half; i++) {
          const leftPage = book.pages[i];
          const rightPage = book.pages[totalPages - 1 - i];

          doc.addPage();

          // Draw left page
          if (leftPage) {
            doc.save();
            doc.translate(0, 0);
            if (leftPage.type === PageType.TEXT) {
              this.drawBookTextPage(
                doc,
                title,
                author,
                leftPage.textContent || '',
                leftPage.number,
              );
            } else if (leftPage.type === PageType.DRAW) {
              await this.drawBookDrawPage(
                doc,
                leftPage.drawImageUrl,
                leftPage.number,
              );
            }
            doc.restore();
          }

          // Draw right page if not the same as left page
          if (rightPage && totalPages - 1 - i !== i) {
            doc.save();
            doc.translate(squareSize + gap, 0);
            if (rightPage.type === PageType.TEXT) {
              this.drawBookTextPage(
                doc,
                title,
                author,
                rightPage.textContent || '',
                rightPage.number,
              );
            } else if (rightPage.type === PageType.DRAW) {
              await this.drawBookDrawPage(
                doc,
                rightPage.drawImageUrl,
                rightPage.number,
              );
            }
            doc.restore();
          }
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

    // 3. Load background template
    // TODO: get the correct cover template based on the theme selected by the user
    const templateBuffer = await this.bucketService.get(
      'cover-templates/azul.pdf',
    );

    if (!templateBuffer || templateBuffer.length === 0)
      throw new NotFoundCoverTemplateException();

    const pdfDoc = await PdfLibDocument.load(templateBuffer);
    const page = pdfDoc.getPages()[0]!;
    const { height } = page.getSize();

    const MM_TO_PT = 72 / 25.4;
    const gapPt = 5 * MM_TO_PT;
    const coverWidth = (page.getWidth() - gapPt) / 2;
    const frontCoverCenterX = (coverWidth + gapPt + page.getWidth()) / 2;

    // 4. Draw School Logo (Top center of front cover)
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

      const logoX = frontCoverCenterX - logoWidth / 2;
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

      const photoWidth = 165;
      const photoHeight = 235;
      const photoX = 90;
      const photoY = height - 217.44 - photoHeight;

      page.drawImage(portraitImage, {
        x: photoX,
        y: photoY,
        width: photoWidth,
        height: photoHeight,
      });
      hasPortrait = true;
    } catch (err) {
      console.error('Failed to embed student portrait photo:', err);
    }

    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
    const helvetica = await pdfDoc.embedFont('Helvetica');

    // 7. Draw Biography Text
    const bioFontSize = 11;
    const bioLineHeight = 15;
    const bioColor = rgb(31 / 255, 41 / 255, 55 / 255); // #1f2937

    // Wrapping rules:
    // Inner biography box starts at x = 174.24 pt, ends at 532.32 pt (width = 358.08 pt).
    // Portrait photo occupies vertical space from top = 217.44 pt to 451.2 pt.
    // If photo exists and current line y < 450 pt from top:
    //   x_start = 265 pt, max_width = 267 pt
    // Else:
    //   x_start = 174.24 pt, max_width = 358.08 pt
    const words = biographyText.split(/\s+/);
    let currentY = 227; // top-down coordinate for text line top

    let lineWords: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const word = words[i]!;
      const isOverlappingPhoto = hasPortrait && currentY < 450;
      const maxLineWidth = isOverlappingPhoto ? 267 : 358;

      const testLine = [...lineWords, word].join(' ');
      const testWidth = helvetica.widthOfTextAtSize(testLine, bioFontSize);

      if (testWidth > maxLineWidth && lineWords.length > 0) {
        const lineText = lineWords.join(' ');
        const xStart = isOverlappingPhoto ? 265 : 174.24;
        page.drawText(lineText, {
          x: xStart,
          y: height - currentY - bioFontSize,
          size: bioFontSize,
          font: helvetica,
          color: bioColor,
        });
        currentY += bioLineHeight;
        lineWords = [word];
      } else {
        lineWords.push(word);
      }
    }

    if (lineWords.length > 0) {
      const isOverlappingPhoto = hasPortrait && currentY < 450;
      const xStart = isOverlappingPhoto ? 265 : 174.24;
      page.drawText(lineWords.join(' '), {
        x: xStart,
        y: height - currentY - bioFontSize,
        size: bioFontSize,
        font: helvetica,
        color: bioColor,
      });
    }

    // 8. Draw Book Title, description, and Student Name (Bottom of front cover)
    const titleText = book.title || 'Sem Título';
    const titleFontSize = 20;
    const titleY = height - 553.7 - titleFontSize;
    const titleWidth = helveticaBold.widthOfTextAtSize(
      titleText,
      titleFontSize,
    );

    // Book title
    page.drawText(titleText, {
      x: frontCoverCenterX - titleWidth / 2,
      y: titleY,
      size: titleFontSize,
      font: helveticaBold,
      color: rgb(10 / 255, 58 / 255, 96 / 255), // #0a3a60
    });

    // "Texto e ilustração de"
    const descText = 'Texto e ilustração de';
    const descFontSize = 10;
    const descY = height - 585 - descFontSize;
    const descWidth = helvetica.widthOfTextAtSize(descText, descFontSize);
    page.drawText(descText, {
      x: frontCoverCenterX - descWidth / 2,
      y: descY,
      size: descFontSize,
      font: helvetica,
      color: rgb(10 / 255, 58 / 255, 96 / 255),
    });

    // Student Name
    const nameText = (book.author || book.student.name).toUpperCase();
    const nameFontSize = 14;
    const nameY = height - 603 - nameFontSize;
    const nameWidth = helveticaBold.widthOfTextAtSize(nameText, nameFontSize);
    page.drawText(nameText, {
      x: frontCoverCenterX - nameWidth / 2,
      y: nameY,
      size: nameFontSize,
      font: helveticaBold,
      color: rgb(10 / 255, 58 / 255, 96 / 255),
    });

    // 9. Draw magnificCode (Bottom of back cover)
    const codeText = book.magnificCode;
    const codeX = 501;
    const codeY1 = height - 551 - 10;
    const codeY2 = height - 566 - 11;

    page.drawText('Código Magnífico', {
      x: codeX,
      y: codeY1,
      size: 10,
      font: helveticaBold,
      color: rgb(31 / 255, 41 / 255, 55 / 255),
    });

    page.drawText(codeText.toUpperCase(), {
      x: codeX,
      y: codeY2,
      size: 11,
      font: helveticaBold,
      color: rgb(31 / 255, 41 / 255, 55 / 255),
    });

    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes);
  }
}
