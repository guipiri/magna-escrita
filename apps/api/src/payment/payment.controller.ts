import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './dto/create-preference.dto';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard';

@Controller('order')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createOrder(@Body() body: CreateOrderDto) {
    return this.paymentService.createOrder(body);
  }

  @Post('webhook')
  @UseGuards(WebhookSignatureGuard)
  handleWebhook(
    @Query() query: { type?: string; id?: string },
    @Body() body: { id: string },
  ) {
    const webhookData = {
      type: query.type,
      data: {
        id: query?.id || body?.id,
      },
    };

    return this.paymentService.handleWebhook(webhookData);
  }
}
