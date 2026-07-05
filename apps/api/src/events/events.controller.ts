import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('events')
  @UseGuards(AuthGuard, BackofficeGuard)
  findAll(@User() user: AuthUser) {
    return this.eventsService.findAll(user);
  }

  @Post('events')
  @UseGuards(AuthGuard, BackofficeGuard)
  create(@Body() body: CreateEventDto, @User() user: AuthUser) {
    return this.eventsService.create(body, user);
  }

  @Put('events/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  update(
    @Param('id') id: string,
    @Body() body: UpdateEventDto,
    @User() user: AuthUser,
  ) {
    return this.eventsService.update(id, body, user);
  }
}
