import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
