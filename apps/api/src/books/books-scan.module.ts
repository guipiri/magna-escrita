import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CloudflareR2Service } from '../common/bucket/providers/cloudflare-r2.service.js';
import { BooksScanController } from './books-scan.controller.js';
import { BooksScanService } from './books-scan.service.js';
import { GeminiDrawExtractor } from './providers/extract-draw.service.js';
import { GeminiTextExtractor } from './providers/extract-text.service.js';
import { JsqrQrCodeReader } from './providers/read-qr-code.service.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [BooksScanController],
  providers: [
    BooksScanService,
    { provide: 'BucketService', useClass: CloudflareR2Service },
    { provide: 'ExtractDrawService', useClass: GeminiDrawExtractor },
    {
      provide: 'ExtractTextService',
      useClass: GeminiTextExtractor,
    },
    { provide: 'ReadQrCodeService', useClass: JsqrQrCodeReader },
  ],
})
export class BooksScanModule {}
