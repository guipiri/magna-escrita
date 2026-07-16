import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorKeys, PageStatus } from '@repo/shared';
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

export class NotFoundStudentException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_STUDENT,
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

export class NotFoundActiveEventForStudentException extends NotFoundException {
  constructor() {
    super({
      key: ErrorKeys.NOT_FOUND_ACTIVE_EVENT_FOR_STUDENT,
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

export class InternalGoogleCloudVisionRecognitionFailedException extends InternalServerErrorException {
  constructor(detail?: string) {
    super({
      key: ErrorKeys.INTERNAL_GOOGLE_CLOUD_VISION_RECOGNITION_FAILED,
      message: `Falha no reconhecimento via Google Cloud Vision${detail ? ': ' + detail : '.'}`,
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

export class BadRequestPageAlreadyProcessedException extends BadRequestException {
  constructor(pageNumber: number, currentStatus: PageStatus | undefined) {
    super({
      key: ErrorKeys.BAD_REQUEST_PAGE_ALREADY_PROCESSED,
      message: `A página ${pageNumber} já foi processada${currentStatus ? ' e está no status ' + currentStatus : ''}. Ela não pode ser processada novamente.`,
    } satisfies HttpExceptionConstructor);
  }
}
