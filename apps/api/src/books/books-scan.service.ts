import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../db/db.service.js';
import { CloudflareR2Service } from '../common/cloudflare-r2.service.js';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { ProcessDrawOpenCV } from './providers/process-draw-page.service.js';
import {
  BadRequestBookTemplateMismatchException,
  BadRequestQrCodeNotReadableException,
  InternalGeminiRecognitionFailedException,
  NotFoundActiveEventForEnrollmentException,
  NotFoundBookTemplatePageException,
  NotFoundEnrollmentException,
} from './books-scan.errors.js';
import type { ReadQrCodeService } from './providers/read-qr-code.service.js';
import {
  generateMagnificCode,
  getOriginalPageUploadBucketPath,
} from './books.utils.js';
import { AuthographsEventStatus, PageType } from '@prisma/client';

interface QrCodeData {
  enrollmentId: string;
  templateId: string;
  page: number;
}

export interface ScanPageResult {
  filename: string;
  enrollmentId: string;
  pageNumber: number;
  status: 'success' | 'error';
  error?: string;
}

export interface ScanBooksResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: ScanPageResult[];
}

@Injectable()
export class BooksScanService {
  private readonly gemini: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly r2: CloudflareR2Service,
    private readonly processDrawOpenCV: ProcessDrawOpenCV,
    @Inject('ReadQrCodeService')
    private readonly readQrCodeService: ReadQrCodeService,
  ) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  async scanImages(files: Express.Multer.File[]): Promise<ScanBooksResult> {
    const results: any[] = [];

    for (const file of files) {
      try {
        const result = await this.processImage(file);
        results.push(result);
      } catch (err: unknown) {
        console.error(`Error processing file ${file.originalname}:`, err);
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido';
        results.push({
          filename: file.originalname,
          enrollmentId: '',
          pageNumber: 0,
          status: 'error',
          error: message,
        });
      }
    }

    const succeeded = results.filter((r) => r.status === 'success').length;

    return {
      processed: results.length,
      succeeded,
      failed: results.length - succeeded,
      results,
    };
  }

  private async processImage(
    file: Express.Multer.File,
  ): Promise<ScanPageResult> {
    // 1. Read QR Code locally with Jimp + jsQR
    const qrStringData = await this.readQrCodeService.execute(file);
    if (!qrStringData) throw new BadRequestQrCodeNotReadableException();
    const qrData = this.parseQrPayload(qrStringData);

    // 2. Fetch enrollment → class → current template
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: qrData.enrollmentId },
      select: {
        id: true,
        class: {
          select: {
            id: true,
            unitId: true,
            schoolYear: true,
            bookTemplateId: true,
          },
        },
      },
    });

    if (!enrollment) throw new NotFoundEnrollmentException();

    // // 3. Validate template consistency
    if (enrollment.class.bookTemplateId !== qrData.templateId) {
      throw new BadRequestBookTemplateMismatchException(
        qrData.templateId,
        enrollment.class.bookTemplateId,
      );
    }

    // 4. Fetch the template page to determine page type
    const templatePage = await this.prisma.bookTemplatePage.findUnique({
      where: {
        bookTemplateId_pageNumber: {
          bookTemplateId: qrData.templateId,
          pageNumber: qrData.page,
        },
      },
      select: { pageType: true },
    });

    if (!templatePage) throw new NotFoundBookTemplatePageException();

    // // 5. Fetch active event for this unit + school year
    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: enrollment.class.unitId,
        schoolYear: enrollment.class.schoolYear,
        status: {
          in: [AuthographsEventStatus.ONGOING, AuthographsEventStatus.PLANNED],
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent) throw new NotFoundActiveEventForEnrollmentException();

    // 6. Upsert the Book

    // Generate a unique magnific code for the book
    let magnificCode = generateMagnificCode();
    while (true) {
      const existingBook = await this.prisma.book.findFirst({
        where: { magnificCode },
      });

      if (!existingBook) break;
      magnificCode = generateMagnificCode();
    }

    const book = await this.prisma.book.upsert({
      where: {
        enrollmentId_authographsEventId: {
          enrollmentId: enrollment.id,
          authographsEventId: activeEvent.id,
        },
      },
      create: {
        magnificCode,
        enrollmentId: enrollment.id,
        authographsEventId: activeEvent.id,
        priceId: await this.getDefaultPriceId(),
      },
      update: {},
      select: { id: true },
    });

    // 7. Save the file to R2 before any processing to ensure we have the original image available in case of errors.
    const originalFileBucketPath = getOriginalPageUploadBucketPath({
      unitId: enrollment.class.unitId,
      eventId: activeEvent.id,
      enrollmentId: enrollment.id,
      bookId: book.id,
      pageNumber: qrData.page,
    });
    const originalImageKey = `${originalFileBucketPath}.${this.getExtension(file.mimetype)}`;
    await this.r2.upload({
      key: originalImageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    // 8. Process page content based on type
    let textContent: string | undefined;
    let drawImageUrl: string | undefined;

    const pageType = templatePage.pageType;

    if (pageType === PageType.DRAW || pageType === PageType.DRAW_TEXT) {
      drawImageUrl = await this.processDrawPage(
        file,
        enrollment.id,
        qrData.page,
      );
    }

    if (pageType === PageType.TEXT || pageType === PageType.DRAW_TEXT) {
      textContent = await this.processTextPage(file);
    }

    // 9. Upsert the Page
    await this.prisma.page.upsert({
      where: {
        bookId_number: {
          bookId: book.id,
          number: qrData.page,
        },
      },
      create: {
        bookId: book.id,
        number: qrData.page,
        type: pageType,
        textContent: textContent ?? null,
        drawImageUrl: drawImageUrl ?? null,
        imageUrl: null,
      },
      update: {
        textContent: textContent ?? null,
        drawImageUrl: drawImageUrl ?? null,
      },
    });

    return {
      filename: file.originalname,
      enrollmentId: enrollment.id,
      pageNumber: qrData.page,
      status: 'success',
    };
  }

  private parseQrPayload(payload: string): QrCodeData {
    let parsed: QrCodeData;
    try {
      parsed = JSON.parse(payload) as QrCodeData;
    } catch {
      throw new BadRequestQrCodeNotReadableException();
    }

    if (
      !parsed.enrollmentId ||
      !parsed.templateId ||
      (!parsed.page && parsed.page !== 0)
    )
      throw new BadRequestQrCodeNotReadableException();

    return parsed;
  }

  private async processDrawPage(
    file: Express.Multer.File,
    enrollmentId: string,
    pageNumber: number,
  ): Promise<string> {
    const processedDrawFile = await this.processDrawOpenCV.execute(file);
    const processedDrawBuffer = Buffer.from(
      await processedDrawFile.arrayBuffer(),
    );
    const key = `draws/${enrollmentId}/page-${pageNumber}-${Date.now()}.${this.getExtension(file.mimetype)}`;

    const url = await this.r2.upload({
      key,
      body: processedDrawBuffer,
      contentType: processedDrawFile.type || file.mimetype,
    });

    return url;
  }

  private async processTextPage(file: Express.Multer.File): Promise<string> {
    const model = this.gemini.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const imagePart: Part = {
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64'),
      },
    };

    let text: string;
    try {
      const result = await model.generateContent([
        imagePart,
        {
          text: `Esta imagem é uma página de livro escrita por uma criança.
Abaixo do cabeçalho há linhas horizontais onde a criança escreveu um texto.
Por favor, transcreva apenas o texto escrito nas linhas, ignorando o cabeçalho (QR Code, nome do aluno, turma, escola, etc.).
Retorne apenas o texto transcrito, sem explicações adicionais.
Se não houver texto escrito, retorne uma string vazia.`,
        },
      ]);
      text = result.response.text().trim();
    } catch (err) {
      console.error('Gemini OCR failed:', err);
      throw new InternalGeminiRecognitionFailedException(
        'reconhecimento de texto (OCR)',
      );
    }

    return text;
  }

  private async getDefaultPriceId(): Promise<string> {
    // Reuse the first available price or create a zero-price placeholder.
    const price = await this.prisma.price.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (price) return price.id;

    const created = await this.prisma.price.create({
      data: { amount: 0 },
      select: { id: true },
    });
    return created.id;
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    return map[mimeType] ?? 'jpg';
  }
}
