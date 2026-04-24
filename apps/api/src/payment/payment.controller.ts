import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-preference')
  async createPreference(
    @Body()
    body: {
      title: string;
      quantity: number;
      price: number;
      description?: string;
      email?: string;
    },
  ) {
    return this.paymentService.createPreference(body);
  }

  @Get('status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPaymentStatus(paymentId);
  }

  @Post('webhook')
  async handleWebhook(@Query() query: any, @Body() body: any) {
    // O Mercado Pago envia os dados via query params ou body
    const webhookData = {
      type: query.type,
      data: {
        id: query.id || body.id,
      },
    };

    return this.paymentService.handleWebhook(webhookData);
  }

  @Get('success')
  async paymentSuccess() {
    return { message: 'Pagamento realizado com sucesso!' };
  }

  @Get('failure')
  async paymentFailure() {
    return { message: 'Pagamento falhou' };
  }

  @Get('pending')
  async paymentPending() {
    return { message: 'Pagamento pendente' };
  }
}
