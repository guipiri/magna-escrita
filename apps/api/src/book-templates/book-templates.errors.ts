import { BadRequestException, NotFoundException } from '@nestjs/common';
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

export class BookTemplateFirstPageMustBeCoverException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_FIRST_PAGE_MUST_BE_COVER,
      message: 'A primeira página do template (Página 0) deve ser do tipo Capa.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplateLastPageMustBeBackCoverException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_LAST_PAGE_MUST_BE_BACK_COVER,
      message: 'A última página do template deve ser do tipo Contra-capa.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplatePagesLengthInvalidException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_PAGES_COUNT_MUST_BE_MULTIPLE_OF_4,
      message: 'O número de páginas internas (excluindo capa e contra-capa) deve ser múltiplo de 4.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplatePagesSequentialException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_PAGES_NOT_SEQUENTIAL,
      message: 'As páginas do template devem ser sequenciais.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplateThemeRequiredException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_THEME_REQUIRED,
      message: 'O tema do template é obrigatório.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplateThemeNameRequiredException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_THEME_NAME_REQUIRED,
      message: 'O nome do tema é obrigatório.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplateThemeColorRequiredException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_THEME_COLOR_REQUIRED,
      message: 'A cor do tema é obrigatória.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplateThemeFileRequiredException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_THEME_FILE_REQUIRED,
      message: 'O PDF do tema é obrigatório.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplateThemeNotFoundException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_BOOK_TEMPLATE_THEME,
      message: 'Tema do template não encontrado.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BookTemplateInteriorCannotHaveCoversException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_INTERIOR_CANNOT_HAVE_COVERS,
      message: 'O miolo do livro não pode conter páginas do tipo Capa ou Contra-capa.',
    } satisfies HttpExceptionConstructor);
  }
}
