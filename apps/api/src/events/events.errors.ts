import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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

export class NotFoundEventException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_EVENT,
      message: 'Evento não encontrado',
    } satisfies HttpExceptionConstructor);
  }
}

export class ConflictEventWithExistingBooksException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_EVENT_WITH_EXISTING_BOOKS,
      message: 'Não é possível alterar a unidade ou o ano letivo de um evento que já possui livros vinculados.',
    } satisfies HttpExceptionConstructor);
  }
}

