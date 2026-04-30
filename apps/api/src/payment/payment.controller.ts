import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './dto/create-preference.dto';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  async createOrder(@Body() body: CreateOrderDto) {
    return this.paymentService.createOrder(body);
  }

  @Post('webhook')
  @UseGuards(WebhookSignatureGuard)
  handleWebhook(@Query() query: unknown, @Body() body: unknown) {
    console.log('Webhook recebido:', { query, body });
    // const webhookData = {
    //   type: query.type,
    //   data: {
    //     id: query.id || body.id,
    //   },
    // };

    // return this.paymentService.handleWebhook(webhookData);
  }
}
