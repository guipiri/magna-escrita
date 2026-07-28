import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PageStatusEnum, type PageStatus, type UpdatePageRequest } from '@repo/shared';

export class UpdatePageDto implements UpdatePageRequest {
  @IsString()
  @IsOptional()
  textContent?: string | null;

  @IsEnum(PageStatusEnum)
  @IsOptional()
  status?: PageStatus;

  @IsString()
  @IsOptional()
  bookGenre?: string | null;

  @IsString()
  @IsOptional()
  bookGenreExplanation?: string | null;

  @IsString()
  @IsOptional()
  thanksMessage?: string | null;

  @IsString()
  @IsOptional()
  schoolMessage?: string | null;

  @IsString()
  @IsOptional()
  schoolTeam?: string | null;
}
