import {
  IsString,
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { CreateClassRequest } from '@repo/shared';

export class CreateClassDto implements CreateClassRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  teacherName!: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  unitId?: string;

  @IsString()
  @IsNotEmpty()
  bookTemplateId!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  students!: string[];
}
