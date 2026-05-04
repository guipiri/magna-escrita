import { Controller, Get, Param, Query } from '@nestjs/common';
import { BooksService } from './books.service.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

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
