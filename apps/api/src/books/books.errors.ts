import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class NotFoundBookException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_BOOK_NOT_FOUND,
      message: 'Livro não encontrado',
    } satisfies HttpExceptionConstructor);
  }
}

export class ConflictBookAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      key: ErrorKeys.CONFLICT_BOOK_ALREADY_EXISTS,
      message: 'Já existe um livro cadastrado para este aluno neste evento.',
    } satisfies HttpExceptionConstructor);
  }
}


export class BadRequestDrawSquareNotFoundException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_DRAW_SQUARE_NOT_FOUND,
      message: 'Não foi possível identificar o quadrado do desenho na imagem.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestImageFileRequiredException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_IMAGE_FILE_REQUIRED,
      message: 'O arquivo de imagem é obrigatório.',
    } satisfies HttpExceptionConstructor);
  }
}


export class ForbiddenBookReadyException extends ForbiddenException {
  constructor() {
    super({
      key: ErrorKeys.FORBIDDEN_BOOK_READY,
      message:
        'Modificações não são permitidas para usuários da escola se o status do livro for PRONTO.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestPageWithoutContentException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_PAGE_WITHOUT_CONTENT,
      message: 'Não é permitido marcar uma página sem conteúdo como revisada.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestInvalidStatusForRoleException extends BadRequestException {
  constructor(roleMessage: string) {
    super({
      key: ErrorKeys.BAD_REQUEST_INVALID_STATUS_FOR_ROLE,
      message: `Status inválido para o perfil de ${roleMessage}`,
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestPageNotRevisedBySchoolException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_PAGE_NOT_REVISED_BY_SCHOOL,
      message: 'Alteração para Pronto permitida apenas se já revisado pela escola',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundPageException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_PAGE,
      message: 'Página não encontrada',
    } satisfies HttpExceptionConstructor);
  }
}

export class ForbiddenPageUpdateException extends ForbiddenException {
  constructor() {
    super({
      key: ErrorKeys.FORBIDDEN_PAGE_UPDATE,
      message: 'Usuário não autorizado a alterar o status da página',
    } satisfies HttpExceptionConstructor);
  }
}
