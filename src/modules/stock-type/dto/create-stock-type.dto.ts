import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockTypeDto {
  @ApiProperty({ example: 'Perishable', description: 'Stock type name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Requires cold storage', required: false })
  @IsOptional()
  @IsString()
  desc?: string;
}
