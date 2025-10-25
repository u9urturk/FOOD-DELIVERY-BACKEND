import { IsUUID, IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({ example: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'b3f8a6e2-1c2d-4f5a-9e5d-0a1b2c3d4e5f' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: 'd4f8b6c2-2b3c-4a5d-9e6f-1b2c3d4e5f6a', required: false })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  currentQuantity: number;

  @ApiProperty({ example: 10.0 })
  @IsNumber()
  minStockLevel: number;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  maxStockLevel: number;

  @ApiProperty({ example: '2025-08-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  lastCountedAt?: string;

  @ApiProperty({ example: 12.50, description: 'Unit price for this specific lot/batch' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
