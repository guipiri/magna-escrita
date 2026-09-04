import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PdfController } from './pdf.controller.js';
import { PdfService } from './pdf.service.js';
import { BucketModule } from '../common/bucket/bucket.module.js';

@Module({
  imports: [DbModule, AuthModule, BucketModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
