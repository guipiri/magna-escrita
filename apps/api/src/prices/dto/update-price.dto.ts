import {
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatePriceRequest } from '@repo/shared';
import { CreatePriceTierDto } from './create-price.dto.js';

export class UpdatePriceDto implements UpdatePriceRequest {
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
