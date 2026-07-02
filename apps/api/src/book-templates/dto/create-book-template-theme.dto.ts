import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBookTemplateThemeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  colorTheme!: string;
}
