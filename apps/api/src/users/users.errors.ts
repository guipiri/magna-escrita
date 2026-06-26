import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class NotFoundUserException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_USER,
      message: 'User not found.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestCannotDeleteSelfException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_CANNOT_DELETE_SELF,
      message: 'You cannot delete your own user account.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestSchoolUserWithoutUnitsException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_SCHOOL_USER_WITHOUT_UNITS,
      message: 'A school role user must be associated with at least one unit.',
    } satisfies HttpExceptionConstructor);
  }
}

export class ConflictEmailAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_EMAIL_ALREADY_EXISTS,
      message: 'A user with this email already exists.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestInvalidRoleForUserCreationException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_INVALID_ROLE_FOR_USER_CREATION,
      message: 'Invalid role for user creation. Must be ADMIN or SCHOOL.',
    } satisfies HttpExceptionConstructor);
  }
}

export class ForbiddenUserNotAdminException extends ForbiddenException {
  constructor() {
    super({
      key: ErrorKeys.FORBIDDEN_USER_NOT_ADMIN,
      message: 'User is not admin',
    } satisfies HttpExceptionConstructor);
  }
}
