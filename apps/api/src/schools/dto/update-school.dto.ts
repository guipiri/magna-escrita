import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  UpdateSchoolRequest,
  UpdateSchoolUnitItem,
} from '@repo/shared';

export class UpdateSchoolUnitItemDto implements UpdateSchoolUnitItem {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateSchoolDto implements UpdateSchoolRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSchoolUnitItemDto)
  units!: UpdateSchoolUnitItemDto[];
}
