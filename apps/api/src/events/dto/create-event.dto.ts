import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
} from 'class-validator';
import { CreateEventRequest, SchoolYear } from '@repo/shared';

export class CreateEventDto implements CreateEventRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  date!: string;

  @IsEnum(SchoolYear)
  schoolYear!: SchoolYear;

  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @IsBoolean()
  useDefaultTimeline!: boolean;

  @IsArray()
  @IsOptional()
  @IsDateString({}, { each: true })
  timelineDates?: string[];
}
