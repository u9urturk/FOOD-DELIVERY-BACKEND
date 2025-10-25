import { IsString, IsOptional, IsIn, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBaseUnitDto {
    @ApiProperty({ example: 'Kilogram', description: 'Human readable unit name' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Ağırlık birimi', required: false })
    @IsOptional()
    @IsString()
    desc?: string;

    @ApiProperty({ example: 'kg', required: false })
    @IsOptional()
    @IsString()
    symbol?: string;

    @ApiProperty({ example: 'kg', description: 'Short name for the unit' })
    @IsString()
    shortName: string;

    @ApiProperty({ 
        example: 1000, 
        description: 'Base conversion factor (e.g., 1 kg = 1000 g)', 
        required: false 
    })
    @IsOptional()
    @IsNumber()
    conversionFactor?: number;

    @ApiProperty({ 
        example: 'gram', 
        description: 'Reference to base unit for conversion', 
        required: false 
    })
    @IsOptional()
    @IsString()
    baseUnit?: string;

    @ApiProperty({ example: true, description: 'Whether the base unit is active' })
    @IsBoolean()
    isActive: boolean;
}
