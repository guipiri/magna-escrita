import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DbModule } from './db/db.module.js';
import { BooksModule } from './books/books.module.js';
import { BooksScanModule } from './books/books-scan.module.js';
import { BooksPdfProcessor } from './books/books-pdf.processor.js';
import { BooksScanProcessor } from './books/books-scan.processor.js';
import { MailModule } from './common/mail/mail.module.js';
import { PdfModule } from './pdf/pdf.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { validationSchema } from './config/validation.js';
import { BucketModule } from './common/bucket/bucket.module.js';
import { getRedisBullConnectionOptions } from './common/redis/redis.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisBullConnectionOptions(
          configService.getOrThrow<string>('REDIS_URL'),
        ),
      }),
      inject: [ConfigService],
    }),
    DbModule,
    RedisModule,
    MailModule,
    PdfModule,
    BooksModule,
    BooksScanModule,
    BucketModule,
  ],
  providers: [BooksPdfProcessor, BooksScanProcessor],
})
export class WorkerModule {}
