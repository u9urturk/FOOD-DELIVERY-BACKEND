import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({
    description: 'ID of the product for this inventory',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Stock type ID for the inventory',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  stockTypeId: string;

  @ApiProperty({
    description: 'Minimum stock level (triggers low stock alert)',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStockLevel: number;

  @ApiProperty({
    description: 'Maximum stock level (triggers overstock alert)',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxStockLevel: number;

  @ApiPropertyOptional({
    description: 'Last inventory count date',
    example: '2025-12-08T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  lastCountedAt?: Date;

  @ApiPropertyOptional({
    description: 'Product expiration date',
    example: '2026-12-08T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  expirationDate?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes or description for inventory',
    example: 'Special storage requirements',
  })
  @IsOptional()
  @IsString()
  desc?: string;
}
