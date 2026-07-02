import {
  BOOK_PAGE_TYPES,
  CreateBookTemplateRequest,
  BookTemplatePage,
} from '@repo/shared';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BookTemplatePageDto implements BookTemplatePage {
  @IsNotEmpty()
  @IsNumber()
  pageNumber!: number;

  @IsString()
  @IsIn(BOOK_PAGE_TYPES as readonly string[])
  pageType!: BookTemplatePage['pageType'];
}

export class CreateBookTemplateDto implements CreateBookTemplateRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  bookTemplateThemeId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  units?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookTemplatePageDto)
  pages!: BookTemplatePageDto[];
}
