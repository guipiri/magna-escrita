import { NotFoundException } from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class NotFoundPdfClassException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_PDF_CLASS,
      message: 'Class not found',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundPdfNoEligiblePagesException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_PDF_NO_ELIGIBLE_PAGES,
      message:
        'The book template for this class has no eligible pages (DRAW, DRAW_TEXT or TEXT)',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundPdfNoEnrollmentsException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_PDF_NO_ENROLLMENTS,
      message: 'This class has no enrolled students',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundPdfNoActiveEventException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_PDF_NO_ACTIVE_EVENT,
      message: 'No active event found for this class unit and school year',
    } satisfies HttpExceptionConstructor);
  }
}

export class ConflictMoreThanOneActiveEventException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_MORE_THAN_ONE_ACTIVE_EVENT,
      message:
        'More than one active event found for this class unit and school year',
    } satisfies HttpExceptionConstructor);
  }
}
