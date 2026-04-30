import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Order } from 'mercadopago';

@Injectable()
export class MercadoPagoProvider {
  public readonly client: MercadoPagoConfig;
  public readonly payment: Payment;
  public readonly order: Order;

  constructor(readonly configService: ConfigService) {
    const accessToken = configService.getOrThrow<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
    );

    this.client = new MercadoPagoConfig({ accessToken });
    this.payment = new Payment(this.client);
    this.order = new Order(this.client);
  }
}
