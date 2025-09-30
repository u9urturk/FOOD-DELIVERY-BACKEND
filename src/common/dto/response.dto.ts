import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'İşlem başarılı olup olmadığını belirtir',
    example: false,
    type: Boolean,
  })
  success: boolean;

  @ApiProperty({
    description: 'Hatanın oluştuğu zaman damgası',
    example: '2024-08-07T10:30:00.000Z',
    type: String,
  })
  timestamp: string;

  @ApiProperty({
    description: 'Hatanın oluştuğu endpoint path',
    example: '/auth/login',
    type: String,
  })
  path: string;

  @ApiProperty({
    description: 'HTTP method',
    example: 'POST',
    type: String,
  })
  method: string;

  @ApiProperty({
    description: 'HTTP status kodu',
    example: 400,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Hata türü',
    example: 'Bad Request',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'Kullanıcıya gösterilecek hata mesajı',
    example: 'Geçersiz doğrulama kodu',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'İstek benzersiz kimliği',
    example: 'req_123456789',
    type: String,
  })
  requestId: string;
}

export class SuccessResponseDto<T = any> {
  @ApiProperty({
    description: 'İşlem başarılı olup olmadığını belirtir',
    example: true,
    type: Boolean,
  })
  success: boolean;

  @ApiProperty({
    description: 'İşlem mesajı',
    example: 'İşlem başarıyla tamamlandı',
    type: String,
  })
  message?: string;

  @ApiProperty({
    description: 'Dönen veri',
  })
  data?: T;

  @ApiProperty({
    description: 'Zaman damgası',
    example: '2024-08-07T10:30:00.000Z',
    type: String,
  })
  timestamp: string;
}
