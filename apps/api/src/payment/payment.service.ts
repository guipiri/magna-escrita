import { Injectable } from '@nestjs/common';
import MercadoPago, { Payment, Preference } from 'mercadopago';

@Injectable()
export class PaymentService {
  private client: MercadoPago;
  private preferenceClient: Preference;
  private paymentClient: Payment;

  constructor() {
    this.client = new MercadoPago({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });

    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
  }

  async createPreference(data: {
    title: string;
    quantity: number;
    price: number;
    description?: string;
    email?: string;
  }) {
    try {
      const preference = await this.preferenceClient.create({
        body: {
          items: [
            {
              id: '1',
              title: data.title,
              quantity: data.quantity,
              unit_price: data.price,
              description: data.description,
            },
          ],
          back_urls: {
            success: `${process.env.APP_URL || 'http://localhost:5173'}/payment/success`,
            failure: `${process.env.APP_URL || 'http://localhost:5173'}/payment/failure`,
            pending: `${process.env.APP_URL || 'http://localhost:5173'}/payment/pending`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.API_URL || 'http://localhost:3000'}/payment/webhook`,
          payer: {
            email: data.email,
          },
        },
      });

      return {
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      };
    } catch (error: any) {
      throw new Error(`Erro ao criar preferência: ${error}`);
    }
  }

  async getPaymentStatus(paymentId: string) {
    try {
      const payment = await this.paymentClient.get({ id: paymentId });

      return {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        description: payment.description,
      };
    } catch (error: any) {
      throw new Error(`Erro ao obter status do pagamento: ${error}`);
    }
  }

  async handleWebhook(data: any) {
    const { type, data: webhookData } = data as {
      type: string;
      data: { id: string };
    };

    if (type === 'payment') {
      const paymentId = webhookData.id;
      const payment = await this.getPaymentStatus(paymentId);

      // Aqui você pode adicionar lógica para processar o pagamento
      // Por exemplo: atualizar banco de dados, enviar email, etc.

      return {
        received: true,
        paymentId,
        status: payment.status,
      };
    }

    return { received: true };
  }
}
