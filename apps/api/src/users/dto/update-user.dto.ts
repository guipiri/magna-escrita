import {
  IsEmail,
  IsEnum,
  IsArray,
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { UpdateUserRequest, UserRole } from '@repo/shared';

export class UpdateUserDto implements UpdateUserRequest {
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @IsNotEmpty()
  role?: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  unitIds?: string[];
}
