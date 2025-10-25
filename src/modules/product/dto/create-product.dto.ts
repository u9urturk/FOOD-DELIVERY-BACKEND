import { IsString, IsOptional, IsUUID, IsArray, IsUrl, ArrayMaxSize, IsEnum, IsDecimal, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: '1234567890123', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 'Cheeseburger', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Delicious beef burger with cheese', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Additional notes about the product', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ 
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'], 
    description: 'Product image URLs (maximum 3 images)',
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @ApiProperty({ 
    example: ProductStatus.ACTIVE, 
    description: 'Product status',
    enum: ProductStatus 
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

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
