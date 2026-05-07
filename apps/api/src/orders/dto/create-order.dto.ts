import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderReq, OrderItem } from '@repo/shared';

class OrderItemDto implements OrderItem {
  @IsString()
  bookId!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateOrderDto implements CreateOrderReq {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  items!: OrderItemDto[];

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  identificationType?: string;

  @IsOptional()
  @IsString()
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  installments!: number;

  @IsString()
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  paymentMethodDetail?: string;

  @IsOptional()
  @IsString()
  issuerId?: string;
}
