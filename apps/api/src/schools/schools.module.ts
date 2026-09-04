import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { SchoolsController } from './schools.controller.js';
import { SchoolsService } from './schools.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { BucketModule } from '../common/bucket/bucket.module.js';

@Module({
  imports: [DbModule, AuthModule, BucketModule],
  controllers: [SchoolsController],
  providers: [SchoolsService],
})
export class SchoolsModule {}
