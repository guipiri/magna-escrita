import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { UpdateClassRequest, UpdateClassStudentItem } from '@repo/shared';

export class UpdateClassDto implements UpdateClassRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  teacherName!: string;

  @IsArray()
  @IsOptional()
  students?: UpdateClassStudentItem[];
}
