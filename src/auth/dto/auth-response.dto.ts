import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'Giriş başarılı' })
  message!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token!: string;

  @ApiProperty({ required: false, example: 'clh3k9e0-abc1-... (session id)' })
  session_id?: string;

  @ApiProperty({ required: false, example: new Date().toISOString() })
  refresh_expires_at?: Date | string;

  @ApiProperty({ required: false, description: 'Yeni kurtarma kodu (opsiyonel)', example: 'ABCD-EFGH' })
  newRecoveryCode?: string;
}
