import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPago, { Payment, Order } from 'mercadopago';

@Injectable()
export class MercadoPagoProvider {
  public readonly client: MercadoPago;
  public readonly payment: Payment;
  public readonly order: Order;

  constructor(readonly configService: ConfigService) {
    const accessToken = configService.getOrThrow<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
    );

    this.client = new MercadoPago({ accessToken });
    this.payment = new Payment(this.client);
    this.order = new Order(this.client);
  }
}
