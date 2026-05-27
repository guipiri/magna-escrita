import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CloudflareR2Service } from '../common/cloudflare-r2.service.js';
import { BooksScanController } from './books-scan.controller.js';
import { BooksScanService } from './books-scan.service.js';
import { ExtractDrawOpenCV } from './providers/extract-page-draw.service.js';
import { ReadQrCodeWithJsQR } from './providers/read-qr-code.service.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [BooksScanController],
  providers: [
    BooksScanService,
    CloudflareR2Service,
    { provide: 'ExtractDrawService', useClass: ExtractDrawOpenCV },
    { provide: 'ReadQrCodeService', useClass: ReadQrCodeWithJsQR },
  ],
})
export class BooksScanModule {}
