import { IsString, IsOptional } from 'class-validator';

export class WebhookQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  id?: string;
}

export class WebhookBodyDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
