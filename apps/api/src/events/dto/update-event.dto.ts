import { IsDateString, IsEnum, IsNotEmpty, IsString, IsBoolean, IsArray, IsOptional } from 'class-validator';
import { UpdateEventRequest, SchoolYear } from '@repo/shared';
import { AuthographsEventStatus } from '@prisma/client';

export class UpdateEventDto implements UpdateEventRequest {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(SchoolYear)
  @IsOptional()
  schoolYear?: SchoolYear;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsBoolean()
  @IsOptional()
  useDefaultTimeline?: boolean;

  @IsArray()
  @IsOptional()
  @IsDateString({}, { each: true })
  timelineDates?: string[];

  @IsEnum(AuthographsEventStatus)
  @IsOptional()
  status?: AuthographsEventStatus;
}
