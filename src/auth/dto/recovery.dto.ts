import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecoveryDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Recovery code for account access',
    example: 'A1B2C3D4',
    type: String,
    minLength: 8,
    maxLength: 8
  })
  @IsString()
  @IsNotEmpty()
  recoveryCode: string;
}