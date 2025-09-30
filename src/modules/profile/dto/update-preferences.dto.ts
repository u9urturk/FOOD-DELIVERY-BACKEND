import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timeZone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  theme?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  density?: string;

  @IsOptional()
  @IsBoolean()
  notificationEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  notificationPush?: boolean;
}
