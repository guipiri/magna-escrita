import { HttpExceptionConstructor } from '@/common/filters/http-exception.filter';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export class ForbiddenMissingAuthTokenException extends ForbiddenException {
  constructor() {
    super({
      key: 'FORBIDDEN_MISSING_AUTH_TOKEN',
      message: 'Missing auth token',
    } satisfies HttpExceptionConstructor);
  }
}

export class ForbiddenInsufficientPermissionsException extends ForbiddenException {
  constructor() {
    super({
      key: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
      message: 'Insufficient permissions',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedInvalidWebhookSignatureException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_INVALID_WEBHOOK_SIGNATURE',
      message: 'Invalid webhook signature',
    } satisfies HttpExceptionConstructor);
  }
}
