import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Central Warehouse' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Istanbul, TR', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'WH-001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true))
  @IsBoolean()
  isActive?: boolean;
}
