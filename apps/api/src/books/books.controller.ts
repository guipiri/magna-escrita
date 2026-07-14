import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';
import { CreateBookDto } from './dto/create-book.dto.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('backoffice')
  @UseGuards(AuthGuard, BackofficeGuard)
  getAll(@User() user: AuthUser) {
    return this.booksService.getAll(user);
  }

  @Post('backoffice')
  @UseGuards(AuthGuard, BackofficeGuard)
  createBook(@Body() body: CreateBookDto, @User() user: AuthUser) {
    return this.booksService.createBook(body, user);
  }

  @Get('backoffice/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  getById(@Param('id') id: string, @User() user: AuthUser) {
    return this.booksService.getById(id, user);
  }

  @Post('backoffice/:id/generate-pdf')
  @UseGuards(AuthGuard, BackofficeGuard)
  generateBookPdf(@Param('id') id: string, @User() user: AuthUser) {
    return this.booksService.generateFinalBookPdf(id, user);
  }

  @Patch('backoffice/:id/pages/:pageNumber')
  @UseGuards(AuthGuard, BackofficeGuard)
  updatePage(
    @Param('id') id: string,
    @Param('pageNumber') pageNumber: string,
    @Body() body: { textContent?: string | null; status?: any },
    @User() user: AuthUser,
  ) {
    return this.booksService.updatePage(id, Number(pageNumber), body, user);
  }

  @Patch('backoffice/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  updateBook(
    @Param('id') id: string,
    @Body() body: { title?: string | null },
    @User() user: AuthUser,
  ) {
    return this.booksService.updateBook(id, body, user);
  }

  @Patch('backoffice/:id/pages/:pageNumber/draw')
  @UseGuards(AuthGuard, BackofficeGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'originalImage', maxCount: 1 },
    ]),
  )
  updatePageDraw(
    @Param('id') id: string,
    @Param('pageNumber') pageNumber: string,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      originalImage?: Express.Multer.File[];
    },
    @User() user: AuthUser,
  ) {
    const image = files.image?.[0];
    const originalImage = files.originalImage?.[0];

    if (!image) {
      throw new Error('Image file is required');
    }

    return this.booksService.updatePageDraw(
      id,
      Number(pageNumber),
      image,
      originalImage,
      user,
    );
  }

  @Get()
  findByIds(@Query('ids') ids?: string | string[]) {
    const normalizedIds = Array.isArray(ids)
      ? ids
      : (ids ?? '').split(',').map((id) => id.trim());

    return this.booksService.findByIds(normalizedIds);
  }

  @Get(':magnificCode')
  findByMagnificCode(@Param('magnificCode') magnificCode: string) {
    return this.booksService.findByMagnificCode(magnificCode);
  }
}
