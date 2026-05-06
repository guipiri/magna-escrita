import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

interface ValidationIssue {
  field: string;
  messages: string[];
}

const collectValidationIssues = (
  errors: ValidationError[],
  parentPath = '',
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const messages = error.constraints ? Object.values(error.constraints) : [];

    if (messages.length) {
      issues.push({ field: path, messages });
    }

    if (error.children && error.children.length > 0) {
      issues.push(...collectValidationIssues(error.children, path));
    }
  }

  return issues;
};

export class ApiValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Dados invalidos',
          errors: collectValidationIssues(errors),
        }),
    });
  }
}
