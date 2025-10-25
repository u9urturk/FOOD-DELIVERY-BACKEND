import { Controller, Get, Post, Put, Delete, Patch, Body, Param } from '@nestjs/common';
import { StockTypeService } from './stock-type.service';
import { CreateStockTypeDto } from './dto/create-stock-type.dto';
import { UpdateStockTypeDto } from './dto/update-stock-type.dto';
import { StockTypeResponseDto, StockTypeListResponseDto } from './dto/stock-type-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';


@ApiTags('Stock Types')
@Controller('stock-types')
export class StockTypeController {
  constructor(private service: StockTypeService) { }

  @Get()
  @ApiOperation({ 
    summary: 'List all stock types with comprehensive analytics',
    description: 'Returns stock types with detailed statistics including total products, most used types, and usage analytics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of stock types with comprehensive analytics',
    type: StockTypeListResponseDto
  })
  async list(): Promise<StockTypeListResponseDto> {
    return this.service.findAll();
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get stock type analytics and statistics only',
    description: 'Returns only statistical data without full stock type details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Stock type analytics and usage statistics'
  })
  async getStats() {
    const result = await this.service.findAll();
    return {
      totalStockTypes: result.total,
      activeStockTypes: result.activeCount,
      inactiveStockTypes: result.inactiveCount,
      totalProducts: result.totalProducts,
      averageProductsPerStockType: result.averageProductsPerStockType,
      mostUsedStockType: result.mostUsedStockType,
      topStockTypes: result.topStockTypes,
      lastUpdated: result.lastUpdated
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'List only active stock types' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active stock types',
    type: [StockTypeResponseDto]
  })
  async listActive(): Promise<StockTypeResponseDto[]> {
    return this.service.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock type by ID with product count' })
  @ApiParam({ name: 'id', description: 'StockType UUID', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Stock type found with itemCount',
    type: StockTypeResponseDto
  })
  async get(@Param('id') id: string): Promise<StockTypeResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new stock type' })
  @ApiBody({ type: CreateStockTypeDto, description: 'Stock type creation payload' })
  @ApiResponse({ 
    status: 201, 
    description: 'Stock type created successfully',
    type: StockTypeResponseDto
  })
  async create(@Body() dto: CreateStockTypeDto): Promise<StockTypeResponseDto> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update stock type completely' })
  @ApiParam({ name: 'id', description: 'StockType UUID', required: true })
  @ApiBody({ type: UpdateStockTypeDto, description: 'Stock type update payload' })
  @ApiResponse({ 
    status: 200, 
    description: 'Stock type updated successfully',
    type: StockTypeResponseDto
  })
  async update(@Param('id') id: string, @Body() dto: UpdateStockTypeDto): Promise<StockTypeResponseDto> {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle stock type active/inactive status' })
  @ApiParam({ name: 'id', description: 'StockType UUID', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Stock type status toggled successfully',
    type: StockTypeResponseDto
  })
  async toggleStatus(@Param('id') id: string): Promise<StockTypeResponseDto> {
    return this.service.toggleStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete stock type (only if no products assigned)' })
  @ApiParam({ name: 'id', description: 'StockType UUID', required: true })
  @ApiResponse({ status: 200, description: 'Stock type deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
