import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ApiValidationPipe } from './common/pipes/validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ApiValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || [
      'http://localhost:5173',
      'http://localhost:4173',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
