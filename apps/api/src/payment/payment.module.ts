import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MercadoPagoProvider } from './providers/mercado-pago.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MercadoPagoProvider, PaymentService],
  controllers: [PaymentController],
  exports: [MercadoPagoProvider],
})
export class PaymentModule {}
