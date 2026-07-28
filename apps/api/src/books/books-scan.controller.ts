import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type _Multer from 'multer'; // ensures Express.Multer.File global namespace
import { BooksScanService } from './books-scan.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser, ScanBooksResult } from '@repo/shared';

@Controller('books/scan')
export class BooksScanController {
  constructor(private readonly booksScanService: BooksScanService) {}

  @Post()
  @UseGuards(AuthGuard, BackofficeGuard)
  @UseInterceptors(FilesInterceptor('images', 50))
  async scanBooks(
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: AuthUser,
  ): Promise<ScanBooksResult> {
    return this.booksScanService.scanImages(files, user);
  }
}
