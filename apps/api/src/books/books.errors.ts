import { BadRequestException, NotFoundException } from '@nestjs/common';
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
