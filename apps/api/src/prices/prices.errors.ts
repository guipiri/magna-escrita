import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class BadRequestDuplicateMinQuantityException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_DUPLICATE_MIN_QUANTITY,
      message: 'Duplicate minimum quantity defined in tiers',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundPriceException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_PRICE,
      message: 'Price table not found',
    } satisfies HttpExceptionConstructor);
  }
}
