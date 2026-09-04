import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../db/db.service.js';
import { PdfService } from '../pdf/pdf.service.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';
import { MailService } from '../common/mail/mail.service.js';
import type { AuthUser } from '@repo/shared';
import {
  getBookCoverBucketKey,
  getBookInteriorBucketKey,
} from '../common/bucket/bucket.utils.js';

export interface GeneratePdfJobPayload {
  bookId: string;
  user: AuthUser;
  activeEventId: string;
  unitId: string;
  studentId: string;
}

@Processor('books-pdf')
@Injectable()
export class BooksPdfProcessor extends WorkerHost {
  private readonly logger = new Logger(BooksPdfProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<GeneratePdfJobPayload>): Promise<void> {
    const { bookId, user, activeEventId, unitId, studentId } = job.data;
    this.logger.log(`Processing generate-pdf job ${job.id} for book ${bookId}`);

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { title: true, magnificCode: true },
    });
    const bookTitle = book?.title || 'Sem Título';
    const magnificCode = book?.magnificCode || '';

    try {
      const [interiorBookPdf, coverBookPdf] = await Promise.all([
        this.pdfService.generateBookInteriorPdf(bookId, user),
        this.pdfService.generateBookCoverPdf(bookId),
      ]);

      const interiorBookKey = getBookInteriorBucketKey({
        eventId: activeEventId,
        unitId,
        studentId,
        bookId,
      });

      const coverBookKey = getBookCoverBucketKey({
        unitId,
        eventId: activeEventId,
        studentId,
        bookId,
      });

      const [interiorPdfUrl, coverPdfUrl] = await Promise.all([
        this.bucketService.upload({
          key: interiorBookKey,
          body: interiorBookPdf,
          contentType: 'application/pdf',
        }),
        this.bucketService.upload({
          key: coverBookKey,
          body: coverBookPdf,
          contentType: 'application/pdf',
        }),
        this.pdfService.generateBookPagesImages(bookId, user),
      ]);

      await this.prisma.book.update({
        where: { id: bookId },
        data: { interiorPdfUrl, coverPdfUrl },
      });

      this.logger.log(
        `Successfully generated and uploaded PDF for book ${bookId}`,
      );

      if (user?.email) {
        await this.mailService.sendBookPdfResultEmail(user.email, {
          bookTitle,
          magnificCode,
          status: 'success',
          interiorPdfUrl,
          coverPdfUrl,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to process generate-pdf job ${job.id} for book ${bookId}:`,
        error,
      );

      if (user?.email) {
        await this.mailService.sendBookPdfResultEmail(user.email, {
          bookTitle,
          magnificCode,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }

      throw error;
    }
  }
}
