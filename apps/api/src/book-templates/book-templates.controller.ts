import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { BookTemplatesService } from './book-templates.service.js';
import { CreateBookTemplateDto } from './dto/create-book-template.dto.js';
import { UpdateBookTemplateDto } from './dto/update-book-template.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { BookTemplateResponse, AuthUser } from '@repo/shared';

@Controller('book-templates')
export class BookTemplatesController {
  constructor(private readonly service: BookTemplatesService) {}

  @Get()
  @UseGuards(AuthGuard, BackofficeGuard)
  findAll(@User() user: AuthUser): Promise<BookTemplateResponse[]> {
    return this.service.findAll(user);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  create(@Body() body: CreateBookTemplateDto): Promise<BookTemplateResponse> {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  update(
    @Param('id') id: string,
    @Body() body: UpdateBookTemplateDto,
  ): Promise<BookTemplateResponse> {
    return this.service.update(id, body);
  }
}
