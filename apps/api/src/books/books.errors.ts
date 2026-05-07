import { NotFoundException } from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter';

export class NotFoundBookException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_BOOK_NOT_FOUND,
      message: 'Livro não encontrado',
    } satisfies HttpExceptionConstructor);
  }
}
