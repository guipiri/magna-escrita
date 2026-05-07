import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type ApiError, ErrorKeys } from '@repo/shared';
import { Request, Response } from 'express';

export interface HttpExceptionConstructor {
  key: ErrorKeys;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload: ApiError = {
      statusCode: status,
      key: ErrorKeys.UNKNOWN_ERROR,
      message: 'Unexpected error',
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.id,
    };

    if (isHttpException) {
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        payload.message = responseBody;
      } else if (responseBody && typeof responseBody === 'object') {
        const body = responseBody as Partial<ApiError> & {
          message?: string | string[];
        };

        if (body.key) payload.key = body.key;

        if (body.message) {
          payload.message = Array.isArray(body.message)
            ? body.message.join('; ')
            : body.message;
        }

        if (body.errors) payload.errors = body.errors;
      }
    }

    if (!isHttpException) console.error('Unhandled exception:', exception);

    response.status(status).json(payload);
  }
}
