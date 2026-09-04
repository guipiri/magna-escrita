import {
  IsArray,
  ArrayNotEmpty,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  CreateScanPresignedUrlsRequest,
  EnqueueScanBatchRequest,
  EnqueueScanItemInput,
  ScanFileInput,
} from '@repo/shared';

export class ScanFileInputDto implements ScanFileInput {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  mimetype!: string;
}

export class CreateScanPresignedUrlsDto implements CreateScanPresignedUrlsRequest {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScanFileInputDto)
  files!: ScanFileInputDto[];
}

export class EnqueueScanItemInputDto implements EnqueueScanItemInput {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  mimetype!: string;
}

export class EnqueueScanBatchDto implements EnqueueScanBatchRequest {
  @IsString()
  @IsNotEmpty()
  batchId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EnqueueScanItemInputDto)
  items!: EnqueueScanItemInputDto[];
}
