import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Beverages', description: 'Category name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Cold and hot drinks', required: false })
  @IsOptional()
  @IsString()
  desc?: string;
}
