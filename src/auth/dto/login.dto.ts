import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'One-time password from Google Authenticator',
    example: '123456',
    type: String,
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}