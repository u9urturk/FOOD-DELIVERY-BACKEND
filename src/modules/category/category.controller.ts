import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';


@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private service: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List Categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async list() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Category by id' })
  @ApiParam({ name: 'id', description: 'Category id', required: true })
  @ApiResponse({ status: 200, description: 'Category found' })
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create Category' })
  @ApiBody({ type: CreateCategoryDto, description: 'Create Category payload' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Category' })
  @ApiParam({ name: 'id', description: 'Category id', required: true })
  @ApiBody({ type: UpdateCategoryDto, description: 'Update Category payload' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Category' })
  @ApiParam({ name: 'id', description: 'Category id', required: true })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
