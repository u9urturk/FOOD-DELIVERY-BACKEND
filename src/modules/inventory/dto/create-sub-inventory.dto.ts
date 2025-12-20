import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubInventoryDto {
  @ApiProperty({
    description: 'Parent inventory ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  inventoryId: string;

  @ApiPropertyOptional({
    description: 'Barcode for this specific batch/lot',
    example: '1234567890123',
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({
    description: 'Warehouse ID where this batch is stored',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  warehouseId: string;

  @ApiPropertyOptional({
    description: 'Supplier ID who provided this batch',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({
    description: 'Quantity of this batch',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Unit price for this batch',
    example: 12.50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Expiration date for this batch',
    example: '2026-06-15T00:00:00Z',
  })

  @IsOptional()
  @Type(() => Date)
  expirationDate?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes or description for this batch',
    example: 'Organic certified batch from Farm A',
  })
  @IsOptional()
  @IsString()
  desc?: string;
}
