import { IsOptional, IsString, IsEmail, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  surname?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false }, { message: 'Geçersiz avatar URL' })
  @MaxLength(500)
  avatarUrl?: string;
}
