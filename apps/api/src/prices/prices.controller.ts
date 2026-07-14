import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { GetPricesResponse, CreatePriceResponse } from '@repo/shared';
import { PricesService } from './prices.service.js';
import { CreatePriceDto } from './dto/create-price.dto.js';
import { UpdatePriceDto } from './dto/update-price.dto.js';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  async getPrices(): Promise<GetPricesResponse[]> {
    return this.pricesService.getPrices();
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  async createPrice(
    @Body() body: CreatePriceDto,
  ): Promise<CreatePriceResponse> {
    return this.pricesService.createPrice(body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async updatePrice(
    @Param('id') id: string,
    @Body() body: UpdatePriceDto,
  ): Promise<CreatePriceResponse> {
    return this.pricesService.updatePrice(id, body);
  }
}
