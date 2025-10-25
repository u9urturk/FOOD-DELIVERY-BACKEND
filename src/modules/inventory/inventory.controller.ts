import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';

import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@ApiTags('Inventories')
@Controller('inventories')
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List Inventories' })
  @ApiResponse({ status: 200, description: 'List of inventory records' })
  async list() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Inventory by id' })
  @ApiParam({ name: 'id', description: 'Inventory id', required: true })
  @ApiResponse({ status: 200, description: 'Inventory found' })
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create Inventory record',
    description: 'Create a new inventory record. Lot number will be auto-generated with format LOT-YYYY-MMDD-XXXX (e.g., LOT-2025-1015-0001)'
  })
  @ApiBody({ type: CreateInventoryDto, description: 'Create Inventory payload' })
  @ApiResponse({ 
    status: 201, 
    description: 'Inventory created successfully with auto-generated lot number',
    schema: {
      example: {
        id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        productId: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        warehouseId: 'b3f8a6e2-1c2d-4f5a-9e5d-0a1b2c3d4e5f',
        supplierId: 'd4f8b6c2-2b3c-4a5d-9e6f-1b2c3d4e5f6a',
        currentQuantity: 100.5,
        minStockLevel: 10.0,
        maxStockLevel: 500.0,
        lotNumber: 'LOT-2025-1015-0001',
        lastCountedAt: '2025-08-01T00:00:00.000Z',
        expirationDate: '2026-01-01T00:00:00.000Z',
        createdAt: '2025-10-15T19:48:37.000Z',
        updatedAt: '2025-10-15T19:48:37.000Z'
      }
    }
  })
  async create(@Body() dto: CreateInventoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Inventory record' })
  @ApiParam({ name: 'id', description: 'Inventory id', required: true })
  @ApiBody({ type: UpdateInventoryDto, description: 'Update Inventory payload' })
  @ApiResponse({ status: 200, description: 'Inventory updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Inventory record' })
  @ApiParam({ name: 'id', description: 'Inventory id', required: true })
  @ApiResponse({ status: 200, description: 'Inventory deleted' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
