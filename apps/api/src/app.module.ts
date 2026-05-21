import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OrdersModule } from './orders/orders.module.js';
import { DbModule } from './db/db.module.js';
import { validationSchema } from './config/validation.js';
import { BooksModule } from './books/books.module.js';
import { BookTemplatesModule } from './book-templates/book-templates.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SchoolsModule } from './schools/schools.module.js';
import { ClassesModule } from './classes/classes.module.js';
import { EventsModule } from './events/events.module.js';

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
    DbModule,
    BooksModule,
    BookTemplatesModule,
    OrdersModule,
    AuthModule,
    SchoolsModule,
    ClassesModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
