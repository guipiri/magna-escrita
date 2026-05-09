import { IsArray, IsString, IsOptional, IsNotEmpty, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class StudentItemDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateClassStudentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentItemDto)
  @ArrayMinSize(1)
  students!: StudentItemDto[];
}
