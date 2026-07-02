import { NotFoundException, BadRequestException } from '@nestjs/common';
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

export class NotFoundPdfNoStudentsException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_PDF_NO_STUDENTS,
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

export class NotFoundPdfPageException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_PDF_PAGE,
      message: 'Page not found',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundCoverException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_COVER,
      message: 'Cover page not found for this book',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundBackCoverException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_BACK_COVER,
      message: 'Back cover not found for this book',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestMissingCoverDrawingException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_MISSING_COVER_DRAWING,
      message: 'Book has no cover drawing image',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestMissingBiographyException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_MISSING_BIOGRAPHY,
      message: 'Book has no biography',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundCoverTemplateException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_COVER_TEMPLATE,
      message: 'Cover template not found',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundLogoException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_UNIT_LOGO,
      message: 'Logo not found',
    } satisfies HttpExceptionConstructor);
  }
}
