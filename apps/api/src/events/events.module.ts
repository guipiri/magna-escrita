import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
