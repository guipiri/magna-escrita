import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class NotFoundSchoolException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_SCHOOL,
      message: 'School not found',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundUnitException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_UNIT,
      message: 'Unit not found',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestTurmaNameException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_GRADE_NAME,
      message: 'Grade name is required',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestStudentsException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_STUDENTS,
      message: 'Add at least one student',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedUserNoAccessToUnitException extends UnauthorizedException {
  constructor() {
    super({
      key: ErrorKeys.UNAUTHORIZED_USER_NO_ACCESS_TO_UNIT,
      message: 'User does not have access to the specified unit',
    } satisfies HttpExceptionConstructor);
  }
}

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
