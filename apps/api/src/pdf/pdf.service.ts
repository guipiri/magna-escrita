import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { AuthUser, UserRole } from '@repo/shared';
import { AuthographsEventStatus, PageType } from '@prisma/client';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import {
  NotFoundPdfClassException,
  NotFoundPdfNoActiveEventException,
  NotFoundPdfNoEligiblePagesException,
  NotFoundPdfNoEnrollmentsException,
} from './pdf.errors.js';

const ELIGIBLE_PAGE_TYPES: PageType[] = [
  PageType.DRAW,
  PageType.DRAW_TEXT,
  PageType.TEXT,
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
      (p) => ELIGIBLE_PAGE_TYPES.includes(p.pageType as PageType),
    );

    if (eligiblePages.length === 0)
      throw new NotFoundPdfNoEligiblePagesException();

    // 3. Fetch enrollments ordered by student name
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId },
      select: {
        id: true,
        student: { select: { id: true, name: true } },
      },
      orderBy: { student: { name: 'asc' } },
    });

    if (enrollments.length === 0) throw new NotFoundPdfNoEnrollmentsException();

    // 4. Fetch the active event for the unit with the same school year
    const activeEvent = await this.prisma.authographsEvent.findFirst({
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

    if (!activeEvent) throw new NotFoundPdfNoActiveEventException();

    // 5. Build PDF in memory
    return this.buildPdf({
      className: classRecord.name,
      unitName: classRecord.units.name,
      schoolName: classRecord.units.school.name,
      eventName: activeEvent.name,
      enrollments,
      eligiblePages,
    });
  }

  private async buildPdf(params: {
    className: string;
    unitName: string | null;
    schoolName: string;
    eventName: string;
    enrollments: Array<{ id: string; student: { name: string } }>;
    eligiblePages: Array<{ pageNumber: number; pageType: PageType }>;
  }): Promise<Buffer> {
    const {
      className,
      unitName,
      schoolName,
      eventName,
      enrollments,
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
        for (const enrollment of enrollments) {
          for (let i = 0; i < eligiblePages.length; i++) {
            const templatePage = eligiblePages[i];
            const pageNum = i + 1;

            // Generate QR code for this page
            const qrData = JSON.stringify({
              enrollmentId: enrollment.id,
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
              studentName: enrollment.student.name,
              className,
              unitName,
              schoolName,
              eventName,
              pageNum,
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
      totalPagesPerStudent,
    } = params;

    // Header background
    doc
      .save()
      .rect(
        PDF_MARGIN / 2,
        PDF_MARGIN / 2,
        doc.page.width - PDF_MARGIN,
        HEADER_HEIGHT,
      )
      .fillAndStroke('#f9fafb', '#e5e7eb')
      .restore();

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
        `Página ${pageNum} de ${totalPagesPerStudent}`,
        TEXT_X,
        TEXT_Y_START + LINE_HEIGHT * 4,
        { lineBreak: false },
      );

    // Separator line below header
    const separatorY = PDF_MARGIN / 2 + HEADER_HEIGHT + 12;
    doc
      .save()
      .moveTo(PDF_MARGIN / 2, separatorY)
      .lineTo(doc.page.width - PDF_MARGIN / 2, separatorY)
      .strokeColor('#e5e7eb')
      .stroke()
      .restore();
  }

  /**
   * Draws the editable area below the header depending on the page type:
   *   DRAW      → full-width square frame (max area)
   *   DRAW_TEXT → smaller square + writing lines below
   *   TEXT      → writing lines only
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

    if (pageType === PageType.DRAW || pageType === PageType.DRAW_TEXT) {
      let squareSize: number;

      if (pageType === PageType.DRAW) {
        // Largest square that fits the content area.
        squareSize = Math.min(contentWidth, contentHeight);
      } else {
        // DRAW_TEXT: reserve space for writing lines below the square.
        const linesBlockHeight = TEXT_LINES_COUNT * WRITING_LINE_HEIGHT;
        const squareMaxHeight = contentHeight - linesBlockHeight - 24;
        squareSize = Math.min(contentWidth, squareMaxHeight);
      }

      // Centre the square horizontally.
      const squareX = contentLeft + (contentWidth - squareSize) / 2;
      const squareY = CONTENT_TOP;

      doc
        .save()
        .rect(squareX, squareY, squareSize, squareSize)
        .strokeColor('#9ca3af')
        .lineWidth(1)
        .stroke()
        .restore();

      if (pageType === PageType.DRAW_TEXT) {
        const linesStartY = squareY + squareSize + 24;
        this.drawWritingLines(
          doc,
          contentLeft,
          linesStartY,
          contentWidth,
          TEXT_LINES_COUNT,
        );
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
      doc.moveTo(x, y).lineTo(x + width, y).stroke();
    }

    doc.restore();
  }
}
