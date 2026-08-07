import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap Worker');

  const app = await NestFactory.createApplicationContext(WorkerModule);

  logger.log('Worker is running in standalone context and listening to queues');
}
void bootstrap();
