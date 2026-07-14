import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { GetPricesResponse } from '@repo/shared';
import { PricesService } from './prices.service.js';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  async getPrices(): Promise<GetPricesResponse[]> {
    return this.pricesService.getPrices();
  }
}
