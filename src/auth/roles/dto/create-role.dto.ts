import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRoleDto {
    @ApiProperty({
        description: 'Unique role name',
        example: 'ADMIN',
        type: String
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Role description',
        example: 'Administrator role with full access',
        type: String
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'Array of permission IDs to assign to this role',
        example: [1, 2, 3],
        type: [String],
        isArray: true
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @Type(() => String)
    permissionIds?: string[];
}