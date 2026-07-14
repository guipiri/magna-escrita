import {
  IsString,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePriceRequest, CreatePriceTierRequest } from '@repo/shared';

export class CreatePriceTierDto implements CreatePriceTierRequest {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minQuantity!: number;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  unitPrice!: number;
}

export class CreatePriceDto implements CreatePriceRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceTierDto)
  @ArrayMinSize(1)
  tiers!: CreatePriceTierDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  classIds!: string[];
}
