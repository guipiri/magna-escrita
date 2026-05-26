import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

export class BadRequestQrCodeNotReadableException extends BadRequestException {
  constructor() {
    super({
      key: ErrorKeys.BAD_REQUEST_QR_CODE_NOT_READABLE,
      message:
        'Não foi possível ler o QR Code da imagem. Verifique se a imagem está nítida e tente novamente.',
    } satisfies HttpExceptionConstructor);
  }
}

export class BadRequestBookTemplateMismatchException extends BadRequestException {
  constructor(uploadedTemplateId: string, currentTemplateId: string) {
    super({
      key: ErrorKeys.BAD_REQUEST_BOOK_TEMPLATE_MISMATCH,
      message: `O template da imagem (${uploadedTemplateId}) é diferente do template atual da turma (${currentTemplateId}). Troque o template da turma para o template original antes de fazer o upload.`,
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundEnrollmentException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_ENROLLMENT,
      message: 'Matrícula não encontrada.',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundBookTemplatePageException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_BOOK_TEMPLATE_PAGE,
      message: 'Página do template não encontrada.',
    } satisfies HttpExceptionConstructor);
  }
}

export class NotFoundActiveEventForEnrollmentException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_ACTIVE_EVENT_FOR_ENROLLMENT,
      message:
        'Nenhum evento ativo encontrado para a turma desta matrícula no ano letivo atual.',
    } satisfies HttpExceptionConstructor);
  }
}

export class InternalGeminiRecognitionFailedException extends InternalServerErrorException {
  constructor(detail?: string) {
    super({
      key: ErrorKeys.INTERNAL_GEMINI_RECOGNITION_FAILED,
      message: `Falha no reconhecimento via Gemini${detail ? ': ' + detail : '.'}`,
    } satisfies HttpExceptionConstructor);
  }
}

export class InternalQrCodeRecognitionFailedException extends InternalServerErrorException {
  constructor(detail?: string) {
    super({
      key: ErrorKeys.INTERNAL_QR_CODE_RECOGNITION_FAILED,
      message: `Falha no reconhecimento do QR Code${detail ? ': ' + detail : '.'}`,
    } satisfies HttpExceptionConstructor);
  }
}
