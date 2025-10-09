import { IsString, IsOptional, IsUUID, IsInt, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Cheeseburger', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Delicious beef burger with cheese', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  // @ApiProperty({ example: 'CB-001', required: false })
  // @IsOptional()
  // @IsString().    note: sku backend tarafıdan otomatik olarak oluşturalacak.input ihtiyacı bulunmamakta 
  // sku?: string;

  @ApiProperty({ example: '1234567890123', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  @IsInt()
  shelfLifeDays?: number;

  @ApiProperty({ example: 'b3f8a6e2-1c2d-4f5a-9e5d-0a1b2c3d4e5f' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'd4f8b6c2-2b3c-4a5d-9e6f-1b2c3d4e5f6a' })
  @IsUUID()
  stockTypeId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-4a3b-9c8d-0e1f2a3b4c5d' })
  @IsUUID()
  baseUnitId: string;
}
