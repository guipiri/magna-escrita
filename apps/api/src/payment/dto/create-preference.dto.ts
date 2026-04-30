import { IsString, IsNumber, IsOptional, IsEmail, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  installments?: number;

  @IsString()
  payment_method_id!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  issuer_id?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
