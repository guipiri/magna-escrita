import { HttpExceptionConstructor } from '@/common/filters/http-exception.filter';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

export class BadRequestMissingGoogleAuthTokenException extends BadRequestException {
  constructor() {
    super({
      key: 'BAD_REQUEST_MISSING_GOOGLE_AUTH_TOKEN',
      message: 'Missing Google auth token',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedMissingGoogleAuthTokenException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_MISSING_GOOGLE_AUTH_TOKEN',
      message: 'Missing Google auth token',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedInvalidGoogleTokenException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_INVALID_GOOGLE_TOKEN',
      message: 'Invalid Google token',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedInvalidGoogleAuthCodeException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_INVALID_GOOGLE_AUTH_CODE',
      message: 'Invalid Google auth code',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedInvalidTokenException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_INVALID_TOKEN',
      message: 'Invalid token',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedUserNotFoundException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_USER_NOT_FOUND',
      message: 'User not found',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedAccessToBackofficeException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_BACKOFFICE_ACCESS',
      message: 'User does not have access to backoffice',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedMissingAuthTokenException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_MISSING_AUTH_TOKEN',
      message: 'Missing auth token',
    } satisfies HttpExceptionConstructor);
  }
}
