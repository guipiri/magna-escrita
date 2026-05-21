import { ConflictException } from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class ConflictEventAlreadyActiveException extends ConflictException {
  constructor(unitName?: string | null) {
    super({
      key: ErrorKeys.CONFLICT_EVENT_ALREADY_ACTIVE,
      message: unitName
        ? `Já existe um evento planejado ou em andamento para a unidade ${unitName}`
        : 'Já existe um evento planejado ou em andamento para esta unidade',
    } satisfies HttpExceptionConstructor);
  }
}
