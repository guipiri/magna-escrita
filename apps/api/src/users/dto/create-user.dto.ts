import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsString,
  IsOptional,
} from 'class-validator';
import { CreateUserRequest, UserRole } from '@repo/shared';

export class CreateUserDto implements CreateUserRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unitIds?: string[];
}
