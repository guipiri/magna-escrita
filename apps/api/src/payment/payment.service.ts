import { Injectable } from '@nestjs/common';
import { MercadoPagoProvider } from './providers/mercado-pago.provider';
import { CreateOrderDto } from './dto/create-preference.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly mercadoPagoProvider: MercadoPagoProvider) {}

  async createOrder(data: CreateOrderDto) {
    if (data.payment_method_id === 'pix') {
      return this.createPixOrder(data);
    } else {
      return this.createCardOrder(data);
    }
  }

  private async createPixOrder(data: CreateOrderDto) {
    try {
      const totalAmount = (data.price * data.quantity).toFixed(2);
      const externalRef = `order-${Date.now()}`;

      const order = await this.mercadoPagoProvider.order.create({
        body: {
          type: 'online',
          external_reference: externalRef,
          total_amount: totalAmount,
          processing_mode: 'automatic',
          payer: {
            email: data.email,
          },
          transactions: {
            payments: [
              {
                amount: totalAmount,
                payment_method: {
                  id: 'pix',
                  type: 'bank_transfer',
                },
              },
            ],
          },
        },
      });

      return { order };
    } catch (error: any) {
      console.error('Erro ao criar Order PIX:', error);
      throw new Error(`Erro ao criar Order PIX: ${error}`);
    }
  }

  private async createCardOrder(data: CreateOrderDto) {
    const {
      payment_method_id: id,
      price,
      quantity,
      email,
      installments,
      token,
    } = data;
    try {
      const totalAmount = (price * quantity).toFixed(2);
      const externalRef = `order-${Date.now()}`;

      const order = await this.mercadoPagoProvider.order.create({
        body: {
          type: 'online',
          external_reference: externalRef,
          total_amount: totalAmount,
          processing_mode: 'automatic',
          payer: { email },
          transactions: {
            payments: [
              {
                amount: totalAmount,
                payment_method: {
                  id,
                  type: 'credit_card',
                  token,
                  installments,
                },
              },
            ],
          },
        },
      });

      return { order };
    } catch (error: any) {
      console.error('Erro ao criar Order de Cartão:', error);
      throw new Error(`Erro ao criar Order de Cartão: ${error}`);
    }
  }

  handleWebhook(data: any) {
    const { type, data: webhookData } = data as {
      type: string;
      data: { id: string };
    };

    if (type === 'payment' || type === 'order') {
      return {
        received: true,
        resourceId: webhookData.id,
      };
    }

    return { received: true };
  }
}
