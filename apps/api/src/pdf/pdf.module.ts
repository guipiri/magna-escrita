import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PdfController } from './pdf.controller.js';
import { PdfService } from './pdf.service.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
