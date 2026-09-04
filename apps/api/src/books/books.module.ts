import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DbModule } from '../db/db.module.js';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { BucketModule } from '../common/bucket/bucket.module.js';
import { PdfModule } from '../pdf/pdf.module.js';

@Module({
  imports: [
    DbModule,
    AuthModule,
    PdfModule,
    BucketModule,
    BullModule.registerQueue({
      name: 'books-pdf',
    }),
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
