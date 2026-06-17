import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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

export class BadRequestDrawSquareNotFoundException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_DRAW_SQUARE_NOT_FOUND,
      message: 'Não foi possível identificar o quadrado do desenho na imagem.',
    } satisfies HttpExceptionConstructor);
  }
}

export class ForbiddenBookReadyException extends ForbiddenException {
  constructor() {
    super({
      key: ErrorKeys.FORBIDDEN_BOOK_READY,
      message: 'Modificações não são permitidas para usuários da escola se o status do livro for PRONTO.',
    } satisfies HttpExceptionConstructor);
  }
}
