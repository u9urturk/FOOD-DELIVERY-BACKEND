import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryMovementDto {
  @ApiProperty({ example: 'product-uuid-123' })
  productId!: string;

  @ApiProperty({ example: 'warehouse-uuid-from', required: false })
  fromWarehouseId?: string;

  @ApiProperty({ example: 'warehouse-uuid-to', required: false })
  toWarehouseId?: string;

  @ApiProperty({ example: 10.5 })
  quantity!: number;

  @ApiProperty({ example: 'pcs' })
  unit!: string;

  @ApiProperty({ example: 'movement-type-uuid' })
  movementTypeId!: string;

  @ApiProperty({ example: 'purchase-order-123', required: false })
  sourceEventId?: string;

  @ApiProperty({ example: 'PURCHASE_ORDER', required: false })
  sourceEventType?: string;

  @ApiProperty({ example: new Date().toISOString() })
  timestamp!: Date;

  @ApiProperty({ example: 'user-uuid-1' })
  userId!: string;
}
