import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InventoryMovementService } from './inventory-movement.service';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('Inventory Movements')
@Controller('inventory-movements')
export class InventoryMovementController {
  constructor(private readonly service: InventoryMovementService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory movements' })
  list(@Query('productId') productId?: string) {
    return this.service.findAll({ productId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movement by id' })
  @ApiParam({ name: 'id' })
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create inventory movement' })
  create(@Body() dto: CreateInventoryMovementDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update movement' })
  update(@Param('id') id: string, @Body() dto: UpdateInventoryMovementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete movement' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
