import { IsString, IsArray, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { CreateClassRequest } from '@repo/shared';

export class CreateGradeDto implements CreateClassRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  students!: string[];
}
