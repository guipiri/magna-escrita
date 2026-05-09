import { IsString, IsNotEmpty } from 'class-validator';
import { UpdateClassRequest } from '@repo/shared';

export class UpdateGradeDto implements UpdateClassRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
