import { Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../db/db.service.js';
import type { ExtractTextService } from './providers/extract-text.service.js';
import type { ReadQrCodeService } from './providers/read-qr-code.service.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';
import { RedisService } from '../common/redis/redis.service.js';
import { MailService } from '../common/mail/mail.service.js';
import {
  $Enums,
  AuthographsEventStatus,
  PageStatus,
  PageType,
} from '@prisma/client';
import { generateMagnificCode } from './books.utils.js';
import {
  getOriginalPageUploadBucketPath,
} from '../common/bucket/bucket.utils.js';
import {
  BadRequestBookTemplateMismatchException,
  BadRequestPageAlreadyProcessedException,
  BadRequestQrCodeNotReadableException,
  InternalFileNotFoundException,
  NotFoundActiveEventForStudentException,
  NotFoundBookTemplatePageException,
  NotFoundStudentException,
} from './books-scan.errors.js';
import { ScanPageResult, ScanPageStatusEnum } from '@repo/shared';
import { ScanPageJobPayload } from './books-scan.queue.js';

interface QrCodeData {
  studentId: string;
  templateId: string;
  page: number;
}

const updateBatchScript = `
  local batchKey = KEYS[1]
  local resultJson = ARGV[1]
  local batchData = redis.call("get", batchKey)
  if not batchData then
    return nil
  end
  local batch = cjson.decode(batchData)
  batch.completed = batch.completed + 1
  if not batch.results then
    batch.results = {}
  end
  table.insert(batch.results, cjson.decode(resultJson))
  local newBatchData = cjson.encode(batch)
  redis.call("set", batchKey, newBatchData, "KEEPTTL")
  return newBatchData
`;

@Processor('books-scan')
@Injectable()
export class BooksScanProcessor extends WorkerHost {
  private readonly logger = new Logger(BooksScanProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
    @Inject('ExtractTextService')
    private readonly extractTextService: ExtractTextService,
    @Inject('ReadQrCodeService')
    private readonly readQrCodeService: ReadQrCodeService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<ScanPageJobPayload>): Promise<void> {
    const { batchId, filename, mimetype, storageKey } = job.data;
    this.logger.log(
      `Processing scan image job ${job.id} for file ${filename} in batch ${batchId}`,
    );

    let studentId = '';
    let pageNumber = 0;
    let resultDetail: ScanPageResult = {
      filename,
      studentId,
      pageNumber,
      status: ScanPageStatusEnum.ERROR,
      error: 'Erro no processamento',
    };

    try {
      const fileBuffer = await this.bucketService.get(storageKey);
      if (!fileBuffer)
        throw new InternalFileNotFoundException(
          `file in ${storageKey} not found in bucket`,
        );

      const mockFile: Express.Multer.File = {
        buffer: fileBuffer,
        originalname: filename,
        mimetype,
        size: fileBuffer.length,
        fieldname: 'images',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      // 1. Read QR Code locally with Jimp + jsQR
      const qrStringData = await this.readQrCodeService.execute(mockFile);
      if (!qrStringData) throw new BadRequestQrCodeNotReadableException();

      const qrData = this.parseQrPayload(qrStringData);
      studentId = qrData.studentId;
      pageNumber = qrData.page;
      this.logger.debug(`QR code data extracted: ${qrStringData}`);

      await this.processImage(mockFile, qrData);

      resultDetail = {
        filename,
        studentId,
        pageNumber,
        status: ScanPageStatusEnum.SUCCESS,
      };
      this.logger.log(`Successfully processed file ${filename}`);
    } catch (err: unknown) {
      this.logger.error(`Failed to process scan image job ${job.id}:`, err);
      let message = 'Erro desconhecido';
      if (err instanceof HttpException) {
        const resp = err.getResponse();
        if (typeof resp === 'string') {
          message = resp;
        } else if (resp && typeof resp === 'object' && 'message' in resp) {
          message = String((resp as any).message);
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      resultDetail = {
        filename,
        studentId,
        pageNumber,
        status: ScanPageStatusEnum.ERROR,
        error: message,
      };
      throw err;
    } finally {
      if (batchId) {
        try {
          const batchKey = `scan-batch:${batchId}`;
          const updatedBatchJson = (await this.redisService
            .getClient()
            .eval(
              updateBatchScript,
              1,
              batchKey,
              JSON.stringify(resultDetail),
            )) as string | null;

          if (updatedBatchJson) {
            const updatedBatch = JSON.parse(updatedBatchJson);
            if (updatedBatch.completed >= updatedBatch.total) {
              this.logger.log(
                `Batch ${batchId} completed! Sending summary email to ${updatedBatch.userEmail}`,
              );
              await this.mailService.sendScanSummaryEmail(
                updatedBatch.userEmail,
                updatedBatch.results,
              );
              await this.redisService.getClient().del(batchKey);
            }
          }
        } catch (redisErr) {
          this.logger.error(
            `Failed to update batch progress in Redis:`,
            redisErr,
          );
        }
      }
    }
  }

  private async processImage(
    file: Express.Multer.File,
    qrData: QrCodeData,
  ): Promise<void> {
    // 2. Fetch student → class → current template
    const student = await this.prisma.student.findUnique({
      where: { id: qrData.studentId },
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

    if (!student) throw new NotFoundStudentException();

    // 3. Validate template consistency
    if (student.class.bookTemplateId !== qrData.templateId) {
      throw new BadRequestBookTemplateMismatchException(
        qrData.templateId,
        student.class.bookTemplateId,
      );
    }

    // 4. Fetch the template page to determine page type
    const template = await this.prisma.bookTemplate.findUnique({
      where: {
        id: qrData.templateId,
      },
      select: {
        bookTemplatePages: {
          select: { pageNumber: true, pageType: true },
        },
      },
    });
    const templatePage = template?.bookTemplatePages.find(
      (p) => p.pageNumber === qrData.page,
    );

    if (!template || !templatePage)
      throw new NotFoundBookTemplatePageException();

    // 5. Fetch active event for this unit + school year
    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: student.class.unitId,
        schoolYear: student.class.schoolYear,
        status: {
          in: [AuthographsEventStatus.ONGOING, AuthographsEventStatus.PLANNED],
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent) throw new NotFoundActiveEventForStudentException();

    // 6. Upsert the Book
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
        studentId_authographsEventId: {
          studentId: student.id,
          authographsEventId: activeEvent.id,
        },
      },
      create: {
        magnificCode,
        studentId: student.id,
        authographsEventId: activeEvent.id,
      },
      update: {},
      select: { id: true },
    });

    await Promise.all(
      template.bookTemplatePages.map(async (p) => {
        const pageTypesToCreateWithStatusReady: $Enums.PageType[] = [
          $Enums.PageType.BLANK,
        ];
        const status = pageTypesToCreateWithStatusReady.includes(p.pageType)
          ? PageStatus.READY
          : PageStatus.NOT_STARTED;

        await this.prisma.page.upsert({
          where: {
            bookId_number: {
              bookId: book.id,
              number: p.pageNumber,
            },
          },
          create: {
            bookId: book.id,
            number: p.pageNumber,
            type: p.pageType,
            status,
          },
          update: {},
        });
      }),
    );
    this.logger.debug(`Book upserted: ${book.id}`);

    const currentPage = await this.prisma.page.findUnique({
      where: {
        bookId_number: {
          bookId: book.id,
          number: qrData.page,
        },
      },
      select: {
        status: true,
      },
    });

    if (!currentPage) {
      throw new NotFoundBookTemplatePageException();
    }

    const allowedStatuses: PageStatus[] = [
      PageStatus.NOT_STARTED,
      PageStatus.IN_PROGRESS,
    ];

    if (!allowedStatuses.includes(currentPage.status)) {
      this.logger.log(
        `Page ${qrData.page} of book ${book.id} is on status ${currentPage.status} and does not have an allowed status to be processed, skipping file upload`,
      );
      throw new BadRequestPageAlreadyProcessedException(
        qrData.page,
        currentPage.status,
      );
    }

    // 7. Save the file to R2 before any processing
    const originalFileBucketKey = getOriginalPageUploadBucketPath({
      unitId: student.class.unitId,
      eventId: activeEvent.id,
      studentId: student.id,
      bookId: book.id,
      pageNumber: qrData.page,
      ext: this.getExtension(file.mimetype),
    });
    const originalImageUrl = await this.bucketService.upload({
      key: originalFileBucketKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    this.logger.debug(`Original image uploaded: ${originalImageUrl}`);

    // 8. Process page content based on type
    let textContent: string | undefined;

    const pageType = templatePage.pageType;

    if (pageType === PageType.TEXT || pageType === PageType.DRAW_TEXT)
      textContent = await this.extractTextService.execute(file);

    // 9. Upsert the Page (keeps status as IN_PROGRESS)
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
        drawImageUrl: null,
        originalImageUrl,
        imageUrl: null,
        status: PageStatus.IN_PROGRESS,
      },
      update: {
        type: pageType,
        textContent: textContent ?? null,
        drawImageUrl: null,
        originalImageUrl,
        imageUrl: null,
        status: PageStatus.IN_PROGRESS,
      },
    });

    if (pageType === PageType.COVER) {
      const title = await this.extractTextService.execute(file);
      await this.prisma.book.update({
        where: { id: book.id },
        data: { title },
      });
    }
  }

  private parseQrPayload(payload: string): QrCodeData {
    let parsed: QrCodeData;
    try {
      parsed = JSON.parse(payload) as QrCodeData;
    } catch {
      throw new BadRequestQrCodeNotReadableException();
    }

    if (
      !parsed.studentId ||
      !parsed.templateId ||
      (!parsed.page && parsed.page !== 0)
    )
      throw new BadRequestQrCodeNotReadableException();

    return parsed;
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
