import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
