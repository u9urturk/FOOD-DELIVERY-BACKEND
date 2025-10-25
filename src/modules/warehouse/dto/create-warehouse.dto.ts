import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum WarehouseType {
  NORMAL = 'NORMAL',
  COLD = 'COLD',
  FROZEN = 'FROZEN',
  DRY = 'DRY'
}

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Central Warehouse', description: 'Depo adı' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Istanbul, TR', description: 'Depo konumu' })
  @IsString()
  location!: string;

  @ApiProperty({ example: '1000 m³', description: 'Depo kapasitesi' })
  @IsString()
  capacity!: string;

  @ApiProperty({ 
    example: 75.5, 
    description: 'Kapasite yüzdesi',
    minimum: 0,
    maximum: 100 
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  capacityPercentage!: number;

  @ApiProperty({ 
    enum: WarehouseStatus, 
    example: WarehouseStatus.ACTIVE,
    description: 'Depo durumu' 
  })
  @IsEnum(WarehouseStatus)
  status!: WarehouseStatus;

  @ApiProperty({ example: 'John Doe', description: 'Depo müdürü' })
  @IsString()
  manager!: string;

  @ApiProperty({ example: 5, description: 'Personel sayısı' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  staffCount!: number;

  @ApiProperty({ example: 500.75, description: 'Depo alanı (m²)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area!: number;

  @ApiProperty({ 
    example: 20.5, 
    description: 'Sıcaklık (°C)', 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temperature?: number;

  @ApiProperty({ 
    enum: WarehouseType, 
    example: WarehouseType.NORMAL,
    description: 'Depo tipi' 
  })
  @IsEnum(WarehouseType)
  warehouseType!: WarehouseType;

  @ApiProperty({ example: 'WH-001', required: false, description: 'Depo kodu' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: true, required: false, description: 'Aktif durumu' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true))
  @IsBoolean()
  isActive?: boolean;
}
