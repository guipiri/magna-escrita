import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { BookTemplatesController } from './book-templates.controller.js';
import { BookTemplatesService } from './book-templates.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { CloudflareR2Service } from '../common/bucket/providers/cloudflare-r2.service.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [BookTemplatesController],
  providers: [
    BookTemplatesService,
    { provide: 'BucketService', useClass: CloudflareR2Service },
  ],
})
export class BookTemplatesModule {}
