import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as http from 'http';
import { WorkerModule } from './worker.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap Worker');

  const app = await NestFactory.createApplicationContext(WorkerModule);

  // O Cloud Run exige que o container escute em uma porta para o health check
  const port = process.env.PORT || 8080;
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Worker is healthy\\n');
  });

  server.listen(port, () => {
    logger.log('Worker is running in standalone context and listening to queues');
    logger.log(`Health check server listening on port ${port}`);
  });
}
void bootstrap();
