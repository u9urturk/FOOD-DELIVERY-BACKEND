import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  IsInt,
  MinLength,
} from 'class-validator';

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
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Sub-inventory description/notes',
    example: 'Batch #123 - Received in excellent condition',
  })
  @IsString()
  @IsOptional()
  subInventoryDesc?: string;
}
