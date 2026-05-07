import { IsString, IsArray, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { CreateGradeRequest } from '@repo/shared';

export class CreateGradeDto implements CreateGradeRequest {
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
