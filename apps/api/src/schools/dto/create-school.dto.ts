import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';
import { CreateSchoolRequest } from '@repo/shared';

export class CreateSchoolDto implements CreateSchoolRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  unitNames!: string[];
}
