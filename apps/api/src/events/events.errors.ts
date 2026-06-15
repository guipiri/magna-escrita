import { BadRequestException, ConflictException } from '@nestjs/common';
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

export class BadRequestTimelineOrderException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_TIMELINE_ORDER,
      message:
        'A ordem dos eventos da timeline deve ser respeitada: o evento n não pode acontecer após o evento n+1.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestTimelinePastException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_TIMELINE_PAST,
      message: 'A data inicial da timeline não pode estar no passado. O evento mais antigo deve ser hoje ou no futuro.',
    } satisfies HttpExceptionConstructor);
  }
}
