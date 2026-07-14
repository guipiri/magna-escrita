import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateBookRequest } from '@repo/shared';

export class CreateBookDto implements CreateBookRequest {
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsString()
  @IsOptional()
  title?: string | null;
}
