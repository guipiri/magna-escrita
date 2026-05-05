import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../db/db.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [ConfigModule, DbModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
