import { IsOptional, IsString } from 'class-validator';
import { GoogleAuthRequest } from '@repo/shared';

export class GoogleAuthDto implements GoogleAuthRequest {
  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
