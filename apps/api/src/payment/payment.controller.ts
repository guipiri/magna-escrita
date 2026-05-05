import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@/auth/auth.service.js';

@Controller('order')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(@Body() body: CreateOrderDto, @User() user: AuthUser) {
    return this.paymentService.createOrder(body, user.id);
  }

  @Get()
  @UseGuards(AuthGuard)
  async listOrders(@User() user: AuthUser) {
    console.log('Listando orders para usuário:', user.email);
    return this.paymentService.listOrders(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getOrder(@Param('id') id: string, @User() user: AuthUser) {
    return this.paymentService.getOrder(id, user.id);
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
