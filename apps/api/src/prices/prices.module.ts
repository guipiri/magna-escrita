import { Module } from '@nestjs/common';
import { PricesController } from './prices.controller.js';
import { PricesService } from './prices.service.js';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  controllers: [PricesController],
  imports: [DbModule, AuthModule],
  providers: [PricesService],
})
export class PricesModule {}
