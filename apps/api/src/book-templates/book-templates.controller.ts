import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BookTemplatesService } from './book-templates.service.js';
import { CreateBookTemplateDto } from './dto/create-book-template.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import type { BookTemplateResponse } from '@repo/shared';

@Controller('book-templates')
export class BookTemplatesController {
  constructor(private readonly service: BookTemplatesService) {}

  @Get()
  @UseGuards(AuthGuard, BackofficeGuard)
  findAll(): Promise<BookTemplateResponse[]> {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, BackofficeGuard)
  create(@Body() body: CreateBookTemplateDto): Promise<BookTemplateResponse> {
    return this.service.create(body);
  }
}
