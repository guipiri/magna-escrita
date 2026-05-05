import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';

@Controller('order')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(@Body() body: CreateOrderDto) {
    return this.paymentService.createOrder(body);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getOrder(@Param('id') id: string) {
    return this.paymentService.getOrder(id);
  }

  @Post('webhook')
  @UseGuards(WebhookSignatureGuard)
  handleWebhook(@Body() body: { data: { id: string }; type?: string }) {
    const type = body.type;
    const resourceId = body.data.id;

    if (!type || !resourceId) {
      console.warn('Invalid webhook payload:', body);
      // todo: register event in db for later analysis
      return { message: 'Invalid payload' };
    }

    return this.paymentService.handleOrderWebhook(resourceId);
  }
}
