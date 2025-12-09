import { IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum AdjustmentType {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
}

export class StockAdjustmentDto {
  @ApiProperty({
    description: 'Sub-inventory (batch) ID to adjust',
    example: '880e8400-e29b-41d4-a716-446655440003',
  })
  @IsString()
  subInventoryId: string;

  @ApiProperty({
    description: 'Type of adjustment',
    enum: AdjustmentType,
    example: AdjustmentType.ADD,
  })
  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @ApiProperty({
    description: 'Quantity to add or subtract',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  quantity: number;
}
