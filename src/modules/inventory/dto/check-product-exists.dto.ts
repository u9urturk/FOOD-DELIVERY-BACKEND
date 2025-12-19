import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class CheckProductExistsDto {
  @ApiPropertyOptional({
    description: 'Product name to check',
    example: 'Organic Tomatoes',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.barcode) // Required if barcode is not provided
  productName?: string;

  @ApiPropertyOptional({
    description: 'Product barcode to check',
    example: '1234567890123',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.productName) // Required if productName is not provided
  barcode?: string;
}
