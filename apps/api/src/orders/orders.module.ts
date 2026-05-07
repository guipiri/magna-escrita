import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersService } from './orders.service.js';
import { MercadoPagoProvider } from './providers/mercado-pago.provider.js';
import { OrdersController } from './orders.controller.js';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Global()
@Module({
  imports: [ConfigModule, DbModule, AuthModule],
  providers: [MercadoPagoProvider, OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
