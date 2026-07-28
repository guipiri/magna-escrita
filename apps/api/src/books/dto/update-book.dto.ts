import { IsOptional, IsString } from 'class-validator';
import { type UpdateBookRequest } from '@repo/shared';

export class UpdateBookDto implements UpdateBookRequest {
  @IsString()
  @IsOptional()
  title?: string | null;
}
