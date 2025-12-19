import { ApiProperty } from '@nestjs/swagger';

export class InventorySummaryItemDto {
  @ApiProperty({
    description: 'Inventory ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  inventoryId: string;

  @ApiProperty({
    description: 'Product ID',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  productId: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Organic Tomatoes',
  })
  productName: string;

  @ApiProperty({
    description: 'Product barcode (from first SubInventory if exists)',
    example: '1234567890123',
    nullable: true,
  })
  barcode: string | null;

  @ApiProperty({
    description: 'Minimum stock level threshold',
    example: 10,
  })
  minStock: number;

  @ApiProperty({
    description: 'Average price calculated from all batches',
    example: 25.50,
  })
  averagePrice: number;

  @ApiProperty({
    description: 'Last inventory count date',
    example: '2025-12-08T10:00:00.000Z',
    nullable: true,
  })
  lastCountedAt: Date | null;

  @ApiProperty({
    description: 'Total stock quantity (sum of all SubInventory quantities)',
    example: 150,
  })
  totalStock: number;

  @ApiProperty({
    description: 'Stock status based on min/max levels',
    example: 'NORMAL',
    enum: ['LOW', 'NORMAL', 'OVERSTOCKED'],
  })
  stockStatus: string;

  @ApiProperty({
    description: 'Number of batches (SubInventories)',
    example: 3,
  })
  batchCount: number;

  @ApiProperty({
    description: 'Category information',
    example: { id: 'cat-123', name: 'Vegetables' },
  })
  category: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Base unit information',
    example: { id: 'unit-123', name: 'Kilogram', symbol: 'kg' },
  })
  baseUnit: {
    id: string;
    name: string;
    symbol: string | null;
  };

  @ApiProperty({
    description: 'Stock type information',
    example: { id: 'type-123', name: 'Perishable', icon: '🥬' },
  })
  stockType: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export class InventorySummaryResponseDto {
  @ApiProperty({
    description: 'Total number of inventory items',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Number of items with low stock',
    example: 5,
  })
  lowStockCount: number;

  @ApiProperty({
    description: 'Number of items with normal stock',
    example: 18,
  })
  normalStockCount: number;

  @ApiProperty({
    description: 'Number of items with overstock',
    example: 2,
  })
  overstockedCount: number;

  @ApiProperty({
    description: 'Total value of all inventory',
    example: 15250.75,
  })
  totalInventoryValue: number;

  @ApiProperty({
    description: 'List of inventory summary items',
    type: [InventorySummaryItemDto],
  })
  items: InventorySummaryItemDto[];
}
