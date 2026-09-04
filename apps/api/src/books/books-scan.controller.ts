import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { BooksScanService } from './books-scan.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type {
  AuthUser,
  CreateScanPresignedUrlsResponse,
  ScanBooksResult,
} from '@repo/shared';
import {
  CreateScanPresignedUrlsDto,
  EnqueueScanBatchDto,
} from './dto/books-scan.dto.js';

@Controller('books/scan')
@UseGuards(AuthGuard, BackofficeGuard)
export class BooksScanController {
  constructor(private readonly booksScanService: BooksScanService) {}

  @Post('presigned-urls')
  async createPresignedUrls(
    @Body() dto: CreateScanPresignedUrlsDto,
    @User() user: AuthUser,
  ): Promise<CreateScanPresignedUrlsResponse> {
    return this.booksScanService.createPresignedUrls(dto, user);
  }

  @Post('enqueue')
  async enqueueBatch(
    @Body() dto: EnqueueScanBatchDto,
    @User() user: AuthUser,
  ): Promise<ScanBooksResult> {
    return this.booksScanService.enqueueBatch(dto, user);
  }
}
