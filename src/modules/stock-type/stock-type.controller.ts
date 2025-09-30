import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { StockTypeService } from './stock-type.service';
import { CreateStockTypeDto } from './dto/create-stock-type.dto';
import { UpdateStockTypeDto } from './dto/update-stock-type.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';


@ApiTags('Stock Types')
@Controller('stock-types')
export class StockTypeController {
  constructor(private service: StockTypeService) { }

  @Get()
  @ApiOperation({ summary: 'List Stock Types' })
  @ApiResponse({ status: 200, description: 'List of stock types' })
  async list() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Stock Type by id' })
  @ApiParam({ name: 'id', description: 'StockType id', required: true })
  @ApiResponse({ status: 200, description: 'Stock type found' })
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create Stock Type' })
  @ApiBody({ type: CreateStockTypeDto, description: 'Create StockType payload' })
  @ApiResponse({ status: 201, description: 'Stock type created' })
  async create(@Body() dto: CreateStockTypeDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Stock Type' })
  @ApiParam({ name: 'id', description: 'StockType id', required: true })
  @ApiBody({ type: UpdateStockTypeDto, description: 'Update StockType payload' })
  @ApiResponse({ status: 200, description: 'Stock type updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateStockTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Stock Type' })
  @ApiParam({ name: 'id', description: 'StockType id', required: true })
  @ApiResponse({ status: 200, description: 'Stock type deleted' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
