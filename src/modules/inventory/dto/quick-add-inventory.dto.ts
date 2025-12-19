import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuickAddInventoryDto {
  @ApiProperty({
    description: 'Product name to search or create',
    example: 'Organic Tomatoes',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  productName: string;

  @ApiPropertyOptional({
    description: 'Category ID for the product (required if product does not exist)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Base unit ID for the product (required if product does not exist)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  @IsOptional()
  baseUnitId?: string;

  @ApiPropertyOptional({
    description: 'Stock type ID for the product (required if product does not exist)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsString()
  @IsOptional()
  stockTypeId?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Fresh organic tomatoes from local farms',
  })
  @IsString()
  @IsOptional()
  productDescription?: string;

  @ApiPropertyOptional({
    description: 'Inventory description',
    example: 'Premium quality batch',
  })
  @IsString()
  @IsOptional()
  inventoryDesc?: string;

  @ApiProperty({
    description: 'Minimum stock level (triggers low stock alert)',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  minStockLevel: number;

  @ApiProperty({
    description: 'Maximum stock level (triggers overstock alert)',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  maxStockLevel: number;

  @ApiPropertyOptional({
    description: 'Last inventory count date (ISO 8601 format)',
    example: '2025-12-08T10:00:00Z',
  })
  
  @IsOptional()
  @Type(() => Date)
  lastCountedAt?: Date;

  @ApiPropertyOptional({
    description: 'Product barcode (for searching or creating product)',
    example: '1234567890123',
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({
    description: 'Quantity to add to inventory',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Unit price per item',
    example: 2.5,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiProperty({
    description: 'Supplier ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({
    description: 'Warehouse ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO 8601 format)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  expirationDate?: Date;

  @ApiPropertyOptional({
    description: 'Sub-inventory description/notes',
    example: 'Batch #123 - Received in excellent condition',
  })
  @IsString()
  @IsOptional()
  subInventoryDesc?: string;
}
