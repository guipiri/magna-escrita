import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service.js';
import { MercadoPagoProvider } from './providers/mercado-pago.provider.js';
import { PaymentController } from './payment.controller.js';
import { DbModule } from '../db/db.module.js';

@Global()
@Module({
  imports: [ConfigModule, DbModule],
  providers: [MercadoPagoProvider, PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
