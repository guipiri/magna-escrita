import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DbModule } from '../db/db.module.js';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { BooksPdfProcessor } from './books-pdf.processor.js';
import { AuthModule } from '../auth/auth.module.js';
import { CloudflareR2Service } from '../common/bucket/providers/cloudflare-r2.service.js';
import { PdfModule } from '../pdf/pdf.module.js';

@Module({
  imports: [
    DbModule,
    AuthModule,
    PdfModule,
    BullModule.registerQueue({
      name: 'books-pdf',
    }),
  ],
  controllers: [BooksController],
  providers: [
    BooksService,
    BooksPdfProcessor,
    { provide: 'BucketService', useClass: CloudflareR2Service },
  ],
})
export class BooksModule {}

