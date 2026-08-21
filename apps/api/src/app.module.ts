import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OrdersModule } from './orders/orders.module.js';
import { DbModule } from './db/db.module.js';
import { validationSchema } from './config/validation.js';
import { BooksModule } from './books/books.module.js';
import { BooksScanModule } from './books/books-scan.module.js';
import { BookTemplatesModule } from './book-templates/book-templates.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SchoolsModule } from './schools/schools.module.js';
import { ClassesModule } from './classes/classes.module.js';
import { EventsModule } from './events/events.module.js';
import { PdfModule } from './pdf/pdf.module.js';
import { UsersModule } from './users/users.module.js';
import { PricesModule } from './prices/prices.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { MailModule } from './common/mail/mail.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.getOrThrow<string>('REDIS_URL'),
          connectTimeout: 10000,
          keepAlive: 10000,
          pingInterval: 10000,
          family: 4,
          maxRetries: 5,
          maxRetriesPerRequest: null,
        } as any,
      }),
      inject: [ConfigService],
    }),
    DbModule,
    RedisModule,
    MailModule,
    BooksModule,
    BooksScanModule,
    BookTemplatesModule,
    OrdersModule,
    AuthModule,
    SchoolsModule,
    ClassesModule,
    EventsModule,
    PdfModule,
    UsersModule,
    PricesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
