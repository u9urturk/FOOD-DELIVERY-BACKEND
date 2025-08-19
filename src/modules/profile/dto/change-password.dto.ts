import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class ChangePasswordDto {
  // İlk parola belirleme durumunda currentPassword gönderilmeyebilir.
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
