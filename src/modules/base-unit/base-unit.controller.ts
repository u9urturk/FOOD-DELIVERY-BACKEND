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
  @ApiOperation({ 
    summary: 'List Base Units',
    description: 'Retrieve all base units ordered by creation date (newest first)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of base units with timestamps',
    schema: {
      example: [
        {
          id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
          name: 'Kilogram',
          desc: 'Weight measurement unit',
          symbol: 'kg',
          createdAt: '2025-10-17T16:46:23.000Z',
          updatedAt: '2025-10-17T16:46:23.000Z',
          products: []
        }
      ]
    }
  })
  async list() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Base Unit by id' })
  @ApiParam({ name: 'id', description: 'BaseUnit id', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Base unit found with timestamps',
    schema: {
      example: {
        id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        name: 'Kilogram',
        desc: 'Weight measurement unit',
        symbol: 'kg',
        createdAt: '2025-10-17T16:46:23.000Z',
        updatedAt: '2025-10-17T16:46:23.000Z',
        products: []
      }
    }
  })
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create Base Unit',
    description: 'Create a new base unit. Timestamps will be automatically generated.'
  })
  @ApiBody({ type: CreateBaseUnitDto, description: 'Create BaseUnit payload' })
  @ApiResponse({ 
    status: 201, 
    description: 'Base unit created successfully with timestamps',
    schema: {
      example: {
        id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        name: 'Kilogram',
        desc: 'Weight measurement unit',
        symbol: 'kg',
        createdAt: '2025-10-17T16:46:23.000Z',
        updatedAt: '2025-10-17T16:46:23.000Z',
        products: []
      }
    }
  })
  async create(@Body() dto: CreateBaseUnitDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update Base Unit',
    description: 'Update an existing base unit. updatedAt timestamp will be automatically updated.'
  })
  @ApiParam({ name: 'id', description: 'BaseUnit id', required: true })
  @ApiBody({ type: UpdateBaseUnitDto, description: 'Update BaseUnit payload' })
  @ApiResponse({ 
    status: 200, 
    description: 'Base unit updated successfully with updated timestamp',
    schema: {
      example: {
        id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        name: 'Updated Kilogram',
        desc: 'Updated weight measurement unit',
        symbol: 'kg',
        createdAt: '2025-10-17T16:46:23.000Z',
        updatedAt: '2025-10-17T17:15:30.000Z',
        products: []
      }
    }
  })
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
