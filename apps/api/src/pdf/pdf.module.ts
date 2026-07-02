import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PdfController } from './pdf.controller.js';
import { PdfService } from './pdf.service.js';
import { CloudflareR2Service } from '../common/bucket/providers/cloudflare-r2.service.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [PdfController],
  providers: [
    PdfService,
    {
      provide: 'BucketService',
      useClass: CloudflareR2Service,
    },
  ],
  exports: [PdfService],
})
export class PdfModule {}
