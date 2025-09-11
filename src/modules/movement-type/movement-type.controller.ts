import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { CreateMovementTypeDto } from './dto/create-movement-type.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { MovementTypeService } from './movement-type.service';
import { UpdateMovementTypeDto } from './dto/update-movement-type.dto';

// @UseGuards(JwtAuthGuard)
@ApiTags('Movement Types')
@Controller('movement-types')
export class MovementTypeController {
  constructor(private readonly service: MovementTypeService) {}

  @Get()
  @ApiOperation({ summary: 'List movement types' })
  list() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movement type by id' })
  @ApiParam({ name: 'id' })
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create movement type' })
  create(@Body() dto: CreateMovementTypeDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update movement type' })
  update(@Param('id') id: string, @Body() dto: UpdateMovementTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete movement type' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Bulk insert movement types (one-off seeding)' })
  seed(@Body() items: CreateMovementTypeDto[]) {
    return this.service.seed(items);
  }
}
