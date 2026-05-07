import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter';

export class BadRequestMissingGoogleAuthTokenException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_MISSING_GOOGLE_AUTH_TOKEN,
      message: 'Missing Google auth token',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedInvalidGoogleCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      key: ErrorKeys.UNAUTHORIZED_INVALID_GOOGLE_CREDENTIALS,
      message: 'Invalid Google credentials',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedInvalidTokenException extends UnauthorizedException {
  constructor() {
    super({
      key: ErrorKeys.UNAUTHORIZED_INVALID_TOKEN,
      message: 'Invalid token',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedUserNotFoundException extends UnauthorizedException {
  constructor() {
    super({
      key: ErrorKeys.UNAUTHORIZED_USER_NOT_FOUND,
      message: 'User not found',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedAccessToBackofficeException extends UnauthorizedException {
  constructor() {
    super({
      key: ErrorKeys.UNAUTHORIZED_BACKOFFICE_ACCESS,
      message: 'User does not have access to backoffice',
    } satisfies HttpExceptionConstructor);
  }
}
