import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateSubInventoryDto } from './dto/create-sub-inventory.dto';
import { UpdateSubInventoryDto } from './dto/update-sub-inventory.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

@ApiTags('Inventory Management')
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== INVENTORY ENDPOINTS ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new inventory', description: 'Creates a new parent inventory record for a product' })
  @ApiResponse({ status: 201, description: 'Inventory created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  createInventory(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.createInventory(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventories', description: 'Retrieve all inventory records with their sub-inventories' })
  @ApiResponse({ status: 200, description: 'List of all inventories' })
  findAllInventories() {
    return this.inventoryService.findAllInventories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory by ID', description: 'Retrieve a specific inventory record by its ID' })
  @ApiParam({ name: 'id', description: 'Inventory ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Inventory found' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  findInventoryById(@Param('id') id: string) {
    return this.inventoryService.findInventoryById(id);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get inventory by product ID', description: 'Retrieve inventory for a specific product' })
  @ApiParam({ name: 'productId', description: 'Product ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Inventory found' })
  @ApiResponse({ status: 404, description: 'Inventory not found for this product' })
  findInventoryByProductId(@Param('productId') productId: string) {
    return this.inventoryService.findInventoryByProductId(productId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update inventory', description: 'Update inventory levels and thresholds' })
  @ApiParam({ name: 'id', description: 'Inventory ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Inventory updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  updateInventory(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.inventoryService.updateInventory(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete inventory', description: 'Delete an inventory record and all its sub-inventories' })
  @ApiParam({ name: 'id', description: 'Inventory ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 204, description: 'Inventory deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  deleteInventory(@Param('id') id: string) {
    return this.inventoryService.deleteInventory(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get inventory statistics', description: 'Get detailed statistics including average price, total value, and stock status' })
  @ApiParam({ name: 'id', description: 'Inventory ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Inventory statistics retrieved' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  getInventoryStats(@Param('id') id: string) {
    return this.inventoryService.getInventoryStats(id);
  }

  // ==================== SUB-INVENTORY ENDPOINTS ====================

  @Post('sub')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create sub-inventory (batch)', description: 'Create a new batch/lot entry for tracking purchases from different suppliers' })
  @ApiResponse({ status: 201, description: 'Sub-inventory created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  createSubInventory(@Body() dto: CreateSubInventoryDto) {
    return this.inventoryService.createSubInventory(dto);
  }

  @Get('sub/all')
  @ApiOperation({ summary: 'Get all sub-inventories', description: 'Retrieve all sub-inventory records, optionally filtered by parent inventory' })
  @ApiQuery({ name: 'inventoryId', required: false, description: 'Filter by parent inventory ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'List of sub-inventories' })
  findAllSubInventories(@Query('inventoryId') inventoryId?: string) {
    return this.inventoryService.findAllSubInventories(inventoryId);
  }

  @Get('sub/:id')
  @ApiOperation({ summary: 'Get sub-inventory by ID', description: 'Retrieve a specific sub-inventory (batch) record' })
  @ApiParam({ name: 'id', description: 'Sub-inventory ID', example: '660e8400-e29b-41d4-a716-446655440001' })
  @ApiResponse({ status: 200, description: 'Sub-inventory found' })
  @ApiResponse({ status: 404, description: 'Sub-inventory not found' })
  findSubInventoryById(@Param('id') id: string) {
    return this.inventoryService.findSubInventoryById(id);
  }

  @Put('sub/:id')
  @ApiOperation({ summary: 'Update sub-inventory', description: 'Update batch details such as price or warehouse location' })
  @ApiParam({ name: 'id', description: 'Sub-inventory ID', example: '660e8400-e29b-41d4-a716-446655440001' })
  @ApiResponse({ status: 200, description: 'Sub-inventory updated successfully' })
  @ApiResponse({ status: 404, description: 'Sub-inventory not found' })
  updateSubInventory(
    @Param('id') id: string,
    @Body() dto: UpdateSubInventoryDto,
  ) {
    return this.inventoryService.updateSubInventory(id, dto);
  }

  @Delete('sub/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete sub-inventory', description: 'Delete a specific batch/lot entry' })
  @ApiParam({ name: 'id', description: 'Sub-inventory ID', example: '660e8400-e29b-41d4-a716-446655440001' })
  @ApiResponse({ status: 204, description: 'Sub-inventory deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sub-inventory not found' })
  deleteSubInventory(@Param('id') id: string) {
    return this.inventoryService.deleteSubInventory(id);
  }

  // ==================== STOCK OPERATIONS ====================

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust stock quantity', description: 'Add or subtract stock from a specific batch' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Sub-inventory not found' })
  adjustStock(@Body() dto: StockAdjustmentDto) {
    return this.inventoryService.adjustStock(dto);
  }

  @Get('reports/low-stock')
  @ApiOperation({ summary: 'Get low stock report', description: 'Get list of inventories below minimum stock threshold' })
  @ApiQuery({ name: 'threshold', required: false, description: 'Custom threshold quantity', example: 10, type: Number })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved' })
  getLowStockItems(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockItems(threshold);
  }
}
