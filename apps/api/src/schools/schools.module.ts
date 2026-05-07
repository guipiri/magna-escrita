import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { SchoolsController } from './schools.controller.js';
import { SchoolsService } from './schools.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [SchoolsController],
  providers: [SchoolsService],
})
export class SchoolsModule {}
