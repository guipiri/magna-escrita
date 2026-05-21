import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
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
}
