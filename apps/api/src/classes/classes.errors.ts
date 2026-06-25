import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class NotFoundClassException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_GRADE,
      message: 'Class not found',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestGradeNameAlreadyExistsException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_GRADE_NAME_ALREADY_EXISTS,
      message: 'A class with that name already exists in this unit',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestMultipleUnitsAccessException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_MULTIPLE_UNITS_ACCESS,
      message: 'User has access to multiple units, unitId must be provided',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestNoValidUnitIdException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_NO_VALID_UNIT_ID,
      message:
        'No valid unitId provided and user does not have access to any units',
    } satisfies HttpExceptionConstructor);
  }
}

export class ConflictExistingBooksException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_EXISTING_BOOKS,
      message: 'Cannot delete student with existing books',
    } satisfies HttpExceptionConstructor);
  }
}

export class ConflictClassTemplateWithExistingBooksException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_EXISTING_BOOKS,
      message: 'Cannot change class book template with existing books',
    } satisfies HttpExceptionConstructor);
  }
}

export class ConflictNoExistingValidUnitException extends ConflictException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_NO_EXISTING_VALID_UNIT,
      message: 'There are no existing valid units',
    } satisfies HttpExceptionConstructor);
  }
}
