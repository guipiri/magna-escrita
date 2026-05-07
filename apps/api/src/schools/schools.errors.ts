import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class NotFoundSchoolException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_SCHOOL,
      message: 'Escola não encontrada',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundUnitException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_UNIT,
      message: 'Unidade não encontrada',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestTurmaNameException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_GRADE_NAME,
      message: 'Nome da turma é obrigatório',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestStudentsException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_STUDENTS,
      message: 'Adicione pelo menos um aluno',
    } satisfies HttpExceptionConstructor);
  }
}

export class UnauthorizedUserNoAccessToUnitException extends UnauthorizedException {
  constructor() {
    super({
      key: ErrorKeys.UNAUTHORIZED_USER_NO_ACCESS_TO_UNIT,
      message: 'Usuário não tem acesso à unidade especificada',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestGradeNameAlreadyExistsException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_GRADE_NAME_ALREADY_EXISTS,
      message: 'Já existe uma turma com esse nome nesta unidade',
    } satisfies HttpExceptionConstructor);
  }
}
