import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BaseUnitService } from './base-unit.service';
import { CreateBaseUnitDto } from './dto/create-base-unit.dto';
import { UpdateBaseUnitDto } from './dto/update-base-unit.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';


@ApiTags('Base Units')
@Controller('base-units')
export class BaseUnitController {
  constructor(private service: BaseUnitService) {}

  @Get()
  @ApiOperation({ summary: 'List Base Units' })
  @ApiResponse({ status: 200, description: 'List of base units' })
  async list() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Base Unit by id' })
  @ApiParam({ name: 'id', description: 'BaseUnit id', required: true })
  @ApiResponse({ status: 200, description: 'Base unit found' })
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create Base Unit' })
  @ApiBody({ type: CreateBaseUnitDto, description: 'Create BaseUnit payload' })
  @ApiResponse({ status: 201, description: 'Base unit created' })
  async create(@Body() dto: CreateBaseUnitDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Base Unit' })
  @ApiParam({ name: 'id', description: 'BaseUnit id', required: true })
  @ApiBody({ type: UpdateBaseUnitDto, description: 'Update BaseUnit payload' })
  @ApiResponse({ status: 200, description: 'Base unit updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateBaseUnitDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Base Unit' })
  @ApiParam({ name: 'id', description: 'BaseUnit id', required: true })
  @ApiResponse({ status: 200, description: 'Base unit deleted' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
