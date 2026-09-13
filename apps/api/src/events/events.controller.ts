import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import { UpdateBookFulfillmentDto } from '../orders/dto/update-book-fulfillment.dto.js';
import { UpdateOrderItemFulfillmentDto } from '../orders/dto/update-order-item-fulfillment.dto.js';
import type {
  AuthUser,
  EventResponse,
  GetEventBookProductionResponse,
  UpdateFulfillmentResponse,
} from '@repo/shared';

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

  @Get('events/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  getById(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<EventResponse> {
    return this.eventsService.getById(id, user);
  }

  @Get('events/:id/production')
  @UseGuards(AuthGuard, BackofficeGuard)
  getEventBookProduction(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<GetEventBookProductionResponse> {
    return this.eventsService.getEventBookProduction(id, user);
  }

  @Patch('events/:id/production/books/:bookId/status')
  @UseGuards(AuthGuard, BackofficeGuard)
  updateEventBookFulfillment(
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Body() body: UpdateBookFulfillmentDto,
    @User() user: AuthUser,
  ): Promise<UpdateFulfillmentResponse> {
    return this.eventsService.updateEventBookFulfillment(
      id,
      bookId,
      body.fulfillmentStatus,
      user,
    );
  }

  @Patch('events/:id/production/items/:orderId/:bookId/status')
  @UseGuards(AuthGuard, BackofficeGuard)
  updateEventOrderItemFulfillment(
    @Param('id') id: string,
    @Param('orderId') orderId: string,
    @Param('bookId') bookId: string,
    @Body() body: UpdateOrderItemFulfillmentDto,
    @User() user: AuthUser,
  ): Promise<UpdateFulfillmentResponse> {
    return this.eventsService.updateEventOrderItemFulfillment(
      id,
      orderId,
      bookId,
      body.fulfillmentStatus,
      user,
    );
  }
}
