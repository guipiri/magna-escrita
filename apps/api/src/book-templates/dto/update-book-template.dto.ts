import {
  UpdateBookTemplateRequest,
} from '@repo/shared';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BookTemplatePageDto } from './create-book-template.dto.js';

export class UpdateBookTemplateDto implements UpdateBookTemplateRequest {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  units?: string[];

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  bookTemplateThemeId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookTemplatePageDto)
  pages?: BookTemplatePageDto[];
}
