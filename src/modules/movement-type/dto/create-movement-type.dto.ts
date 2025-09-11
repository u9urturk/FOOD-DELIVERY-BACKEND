import { ApiProperty } from '@nestjs/swagger';

export class CreateMovementTypeDto {
  @ApiProperty({ example: 'RECEIPT' })
  name!: string;

  @ApiProperty({ example: 'Goods received from supplier', required: false })
  desc?: string;
}
