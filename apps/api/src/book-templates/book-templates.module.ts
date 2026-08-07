import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { BookTemplatesController } from './book-templates.controller.js';
import { BookTemplatesService } from './book-templates.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { BucketModule } from '../common/bucket/bucket.module.js';

@Module({
  imports: [DbModule, AuthModule, BucketModule],
  controllers: [BookTemplatesController],
  providers: [
    BookTemplatesService,
  ],
})
export class BookTemplatesModule {}
