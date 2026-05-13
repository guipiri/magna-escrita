import {
  IsString,
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { CreateClassRequest, SchoolYear } from '@repo/shared';

export class CreateGradeDto implements CreateClassRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  teacherName!: string;

  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @IsEnum(SchoolYear)
  schoolYear?: SchoolYear;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  students!: string[];
}
