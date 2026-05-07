import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class NotFoundOrderException extends NotFoundException {
  constructor(orderId: string) {
    super({
      key: ErrorKeys.NOT_FOUND_ORDER,
      message: `Order with id ${orderId} not found`,
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
