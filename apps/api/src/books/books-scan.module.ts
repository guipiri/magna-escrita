import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BooksScanController } from './books-scan.controller.js';
import { BooksScanService } from './books-scan.service.js';
import { GeminiDrawExtractor } from './providers/extract-draw.service.js';
import { GeminiTextExtractor } from './providers/extract-text.service.js';
import { JsqrQrCodeReader } from './providers/read-qr-code.service.js';
import { BucketModule } from '../common/bucket/bucket.module.js';

@Module({
  imports: [
    DbModule,
    AuthModule,
    BucketModule,
    BullModule.registerQueue({
      name: 'books-scan',
    }),
  ],
  controllers: [BooksScanController],
  providers: [
    BooksScanService,
    { provide: 'ExtractDrawService', useClass: GeminiDrawExtractor },
    {
      provide: 'ExtractTextService',
      useClass: GeminiTextExtractor,
    },
    { provide: 'ReadQrCodeService', useClass: JsqrQrCodeReader },
  ],
  exports: [
    BooksScanService,
    'ExtractDrawService',
    'ExtractTextService',
    'ReadQrCodeService',
  ],
})
export class BooksScanModule {}
