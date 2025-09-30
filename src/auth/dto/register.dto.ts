import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'john_doe',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}