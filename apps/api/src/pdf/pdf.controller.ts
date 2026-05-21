import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';
import { PdfService } from './pdf.service.js';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('class/:classId')
  @UseGuards(AuthGuard, BackofficeGuard)
  async downloadClassPdf(
    @Param('classId') classId: string,
    @User() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.pdfService.generateClassPdf(classId, user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="autografos.pdf"`,
      'Content-Length': buffer.length.toString(),
    });

    res.end(buffer);
  }
}
