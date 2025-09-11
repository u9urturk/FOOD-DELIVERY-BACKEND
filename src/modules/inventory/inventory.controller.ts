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
  @ApiOperation({ summary: 'Create Inventory record' })
  @ApiBody({ type: CreateInventoryDto, description: 'Create Inventory payload' })
  @ApiResponse({ status: 201, description: 'Inventory created' })
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
