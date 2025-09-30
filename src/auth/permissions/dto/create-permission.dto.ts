import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Unique permission name',
    example: 'CREATE_USER'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Permission description',
    example: 'Permission to create new users',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
}