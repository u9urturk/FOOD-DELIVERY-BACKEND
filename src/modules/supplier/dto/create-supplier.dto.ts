import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Acme Foods' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Contact person, phone, notes', required: false })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiProperty({ example: '+90 555 555 5555', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'supplier@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Istanbul, TR', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  leadTimeDays?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
