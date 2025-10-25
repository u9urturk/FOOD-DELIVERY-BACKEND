import { IsString, IsOptional, IsArray, ArrayMinSize, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockTypeDto {
  @ApiProperty({ 
    example: 'Hammadde', 
    description: 'Stock type name',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @Length(2, 50, { message: 'Stok türü adı 2-50 karakter arasında olmalıdır' })
  name: string;

  @ApiProperty({ 
    example: 'Yemek hazırlığında kullanılan temel malzemeler', 
    description: 'Detailed description of stock type',
    required: false,
    minLength: 10,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(10, 500, { message: 'Açıklama 10-500 karakter arasında olmalıdır' })
  description?: string;

  @ApiProperty({ 
    example: 'from-blue-500 to-blue-600', 
    description: 'Tailwind gradient color class for UI theming',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^from-\w+-\d{3} to-\w+-\d{3}$/, { 
    message: 'Renk formatı "from-color-500 to-color-600" şeklinde olmalıdır' 
  })
  color?: string;

  @ApiProperty({ 
    example: '📦', 
    description: 'Emoji icon for visual representation',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(1, 2, { message: 'Icon 1-2 karakter (emoji) olmalıdır' })
  icon?: string;

  @ApiProperty({ 
    example: ['Et', 'Tavuk', 'Balık', 'Sebze'], 
    description: 'Example products for this stock type',
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'En az bir örnek ürün eklemelisiniz' })
  @IsString({ each: true })
  @Length(2, 50, { each: true, message: 'Her örnek ürün 2-50 karakter arasında olmalıdır' })
  examples?: string[];
}
