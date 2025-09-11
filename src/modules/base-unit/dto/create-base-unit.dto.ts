import { IsString, IsOptional } from 'class-validator';
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
}
