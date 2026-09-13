import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class BadRequestOrderItemsNotDeliveredToSchoolException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_ORDER_ITEMS_NOT_DELIVERED_TO_SCHOOL,
      message:
        'Todos os itens do pedido devem estar entregues à escola para confirmar a entrega à família.',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundOrderException extends NotFoundException {
  constructor(orderId: string) {
    super({
      key: ErrorKeys.NOT_FOUND_ORDER,
      message: `Order with id ${orderId} not found`,
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundOrderItemException extends NotFoundException {
  constructor(orderId: string, bookId: string) {
    super({
      key: ErrorKeys.NOT_FOUND_ORDER_ITEM,
      message: `Order item with orderId ${orderId} and bookId ${bookId} not found`,
    } satisfies HttpExceptionConstructor);
  }
}

export class CreatePixOrderFailedException extends BadGatewayException {
  constructor(providerMessage?: string) {
    const message = providerMessage || 'Failed to create PIX order';

    super({
      key: ErrorKeys.CREATE_PIX_ORDER_FAILED,
      message,
    } satisfies HttpExceptionConstructor);
  }
}

export class CreateCardOrderFailedException extends BadGatewayException {
  constructor(providerMessage?: string) {
    const message = providerMessage || 'Failed to create card order';

    super({
      key: ErrorKeys.CREATE_CARD_ORDER_FAILED,
      message,
    } satisfies HttpExceptionConstructor);
  }
}
