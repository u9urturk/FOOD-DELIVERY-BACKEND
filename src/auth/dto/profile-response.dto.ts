import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
    type: Number
  })
  userId: number;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
    type: String
  })
  username: string;

  @ApiProperty({
    description: 'User roles',
    example: ['USER', 'MANAGER'],
    type: [String],
    isArray: true
  })
  roles: string[];
}