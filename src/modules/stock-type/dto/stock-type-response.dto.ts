import { ApiProperty } from '@nestjs/swagger';

export class StockTypeStatsDto {
  @ApiProperty({ 
    example: 'uuid-string-here',
    description: 'Most used stock type ID'
  })
  mostUsedStockTypeId: string;

  @ApiProperty({ 
    example: 'Hammadde',
    description: 'Most used stock type name'
  })
  mostUsedStockTypeName: string;

  @ApiProperty({ 
    example: 25,
    description: 'Product count of most used stock type'
  })
  mostUsedCount: number;

  @ApiProperty({ 
    example: 45.5,
    description: 'Percentage of products using most popular stock type'
  })
  mostUsedPercentage: number;
}

export class StockTypeResponseDto {
  @ApiProperty({ 
    example: 'uuid-string-here',
    description: 'Unique identifier for the stock type'
  })
  id: string;

  @ApiProperty({ 
    example: 'Hammadde',
    description: 'Stock type name'
  })
  name: string;

  @ApiProperty({ 
    example: 'Yemek hazırlığında kullanılan temel malzemeler',
    description: 'Detailed description of stock type'
  })
  description: string;

  @ApiProperty({ 
    example: 'from-blue-500 to-blue-600',
    description: 'Tailwind gradient color class for UI theming'
  })
  color: string;

  @ApiProperty({ 
    example: '📦',
    description: 'Emoji icon for visual representation'
  })
  icon: string;

  @ApiProperty({ 
    example: ['Et', 'Tavuk', 'Balık', 'Sebze'],
    description: 'Example products for this stock type',
    type: [String]
  })
  examples: string[];

  @ApiProperty({ 
    example: 15,
    description: 'Number of products using this stock type'
  })
  itemCount: number;

  @ApiProperty({ 
    example: true,
    description: 'Whether the stock type is active'
  })
  isActive: boolean;

  @ApiProperty({ 
    example: '2024-01-01T00:00:00Z',
    description: 'Creation timestamp'
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2024-01-01T00:00:00Z',
    description: 'Last update timestamp'
  })
  updatedAt: Date;
}

export class StockTypeListResponseDto {
  @ApiProperty({ 
    type: [StockTypeResponseDto],
    description: 'List of stock types'
  })
  data: StockTypeResponseDto[];

  @ApiProperty({ 
    example: 10,
    description: 'Total count of stock types'
  })
  total: number;

  @ApiProperty({ 
    example: 8,
    description: 'Count of active stock types'
  })
  activeCount: number;

  @ApiProperty({ 
    example: 2,
    description: 'Count of inactive stock types'
  })
  inactiveCount: number;

  @ApiProperty({ 
    example: 155,
    description: 'Total number of products across all stock types'
  })
  totalProducts: number;

  @ApiProperty({ 
    example: 15.5,
    description: 'Average number of products per stock type'
  })
  averageProductsPerStockType: number;

  @ApiProperty({ 
    type: StockTypeStatsDto,
    description: 'Statistics about most used stock type'
  })
  mostUsedStockType: StockTypeStatsDto;

  @ApiProperty({ 
    example: ['Hammadde: 25 ürün', 'Temizlik: 20 ürün', 'Ambalaj: 15 ürün'],
    description: 'Top 3 stock types by usage',
    type: [String]
  })
  topStockTypes: string[];

  @ApiProperty({ 
    example: '2024-01-15T10:30:00Z',
    description: 'Last updated timestamp for this report'
  })
  lastUpdated: Date;
}