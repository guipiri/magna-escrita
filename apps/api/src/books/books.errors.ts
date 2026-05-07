import { HttpExceptionConstructor } from '@/common/filters/http-exception.filter';
import { NotFoundException } from '@nestjs/common';

export class NotFoundBookException extends NotFoundException {
  constructor() {
    super({
      key: 'NOT_FOUND_BOOK_NOT_FOUND',
      message: 'Livro não encontrado',
    } satisfies HttpExceptionConstructor);
  }
}
