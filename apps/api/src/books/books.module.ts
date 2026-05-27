import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { CloudflareR2Service } from '../common/cloudflare-r2.service.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [BooksController],
  providers: [BooksService, CloudflareR2Service],
})
export class BooksModule {}
