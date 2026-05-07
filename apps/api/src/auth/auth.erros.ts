import { HttpExceptionConstructor } from '@/common/filters/http-exception.filter';
import { UnauthorizedException } from '@nestjs/common';

export class UnauthorizedAccessToBackofficeException extends UnauthorizedException {
  constructor() {
    super({
      key: 'UNAUTHORIZED_BACKOFFICE_ACCESS',
      message: 'User does not have access to backoffice',
    } satisfies HttpExceptionConstructor);
  }
}
