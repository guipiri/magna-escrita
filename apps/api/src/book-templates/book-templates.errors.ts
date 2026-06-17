import { BadRequestException } from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class ConflictRemoveUnitWithBooksException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_REMOVE_UNIT_WITH_BOOKS,
      message:
        'Não é possível remover a unidade porque existem livros criados utilizando este template nas turmas dessa unidade.',
    } satisfies HttpExceptionConstructor);
  }
}

export class ConflictChangePagesWithBooksException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_CHANGE_PAGES_WITH_BOOKS,
      message:
        'Não é possível alterar as páginas do template porque existem livros criados utilizando ele.',
    } satisfies HttpExceptionConstructor);
  }
}
