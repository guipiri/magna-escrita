import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../../common/filters/http-exception.filter.js';

export class ForbiddenMissingAuthTokenException extends ForbiddenException {
  constructor() {
    super({
      key: ErrorKeys.FORBIDDEN_MISSING_AUTH_TOKEN,
      message: 'Missing auth token',
    } satisfies HttpExceptionConstructor);
  }
}

export class ForbiddenInsufficientPermissionsException extends ForbiddenException {
  constructor() {
    super({
      key: ErrorKeys.FORBIDDEN_INSUFFICIENT_PERMISSIONS,
      message: 'Insufficient permissions',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedInvalidWebhookSignatureException extends UnauthorizedException {
  constructor() {
    super({
      key: ErrorKeys.UNAUTHORIZED_INVALID_WEBHOOK_SIGNATURE,
      message: 'Invalid webhook signature',
    } satisfies HttpExceptionConstructor);
  }
}
