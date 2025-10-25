import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsBoolean, IsInt, IsEnum, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SupplierStatus } from './create-supplier.dto';

export class UpdateSupplierDto {
  @ApiProperty({ example: 'Acme Foods', description: 'Tedarikçi adı', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Gıda ve İçecek', description: 'Tedarikçi kategorisi', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: '+90 555 555 5555', description: 'Telefon numarası', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'supplier@example.com', description: 'E-posta adresi', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    example: 4.5, 
    description: 'Değerlendirme puanı (0-5)', 
    minimum: 0, 
    maximum: 5,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({ 
    enum: SupplierStatus, 
    example: SupplierStatus.ACTIVE,
    description: 'Tedarikçi durumu',
    required: false 
  })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @ApiProperty({ example: 'Istanbul, Ataşehir, TR', description: 'Adres', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'John Doe', description: 'İletişim kişisi', required: false })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({ example: '1234567890', description: 'Vergi numarası', required: false })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiProperty({ example: '30 gün vadeli', description: 'Ödeme koşulları', required: false })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiProperty({ example: 7, description: 'Teslimat süresi (gün)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  deliveryTime?: number;

  @ApiProperty({ example: 1000, description: 'Minimum sipariş tutarı (TL)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumOrder?: number;

  @ApiProperty({ 
    example: ['Sebze', 'Meyve', 'Et Ürünleri'], 
    description: 'Ürün listesi',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products?: string[];

  @ApiProperty({ 
    example: '2024-01-01', 
    description: 'Sözleşme başlangıç tarihi (ISO 8601)',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  contractStartDate?: string;

  @ApiProperty({ 
    example: '2024-12-31', 
    description: 'Sözleşme bitiş tarihi (ISO 8601)',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  // Legacy fields - backward compatibility
  @ApiProperty({ example: 'Contact person, phone, notes', required: false })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  leadTimeDays?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true))
  @IsBoolean()
  isActive?: boolean;
}
