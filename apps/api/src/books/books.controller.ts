import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('backoffice')
  @UseGuards(AuthGuard, BackofficeGuard)
  getAll(@User() user: AuthUser) {
    return this.booksService.getAll(user);
  }

  @Get('backoffice/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  getById(@Param('id') id: string, @User() user: AuthUser) {
    return this.booksService.getById(id, user);
  }

  @Patch('backoffice/:id/pages/:pageNumber')
  @UseGuards(AuthGuard, BackofficeGuard)
  updatePage(
    @Param('id') id: string,
    @Param('pageNumber') pageNumber: string,
    @Body() body: { textContent?: string | null },
    @User() user: AuthUser,
  ) {
    return this.booksService.updatePage(
      id,
      Number(pageNumber),
      body.textContent,
      user,
    );
  }

  @Patch('backoffice/:id/pages/:pageNumber/draw')
  @UseGuards(AuthGuard, BackofficeGuard)
  @UseInterceptors(FileInterceptor('image'))
  updatePageDraw(
    @Param('id') id: string,
    @Param('pageNumber') pageNumber: string,
    @UploadedFile() file: Express.Multer.File,
    @User() user: AuthUser,
  ) {
    return this.booksService.updatePageDraw(
      id,
      Number(pageNumber),
      file.buffer,
      file.mimetype,
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
