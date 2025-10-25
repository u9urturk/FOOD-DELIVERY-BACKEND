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
  @ApiOperation({ 
    summary: 'List Categories',
    description: 'Retrieve all categories ordered by creation date (newest first)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of categories with timestamps',
    schema: {
      example: [
        {
          id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
          name: 'Beverages',
          desc: 'Cold and hot drinks',
          createdAt: '2025-10-17T15:30:07.000Z',
          updatedAt: '2025-10-17T15:30:07.000Z',
          products: []
        }
      ]
    }
  })
  async list() {
    return this.service.findAll();
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get Category Statistics',
    description: 'Retrieve statistics about categories including total, categories with products, and empty categories'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Category statistics',
    schema: {
      example: {
        totalCategories: 10,
        categoriesWithProducts: 7,
        emptyCategories: 3
      }
    }
  })
  async getStats() {
    return this.service.getStats();
  }

  @Get('with-product-counts')
  @ApiOperation({ 
    summary: 'Get Categories with Product Counts',
    description: 'Retrieve all categories with their respective product counts for detailed analytics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Categories with product counts',
    schema: {
      example: [
        {
          id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
          name: 'Beverages',
          desc: 'Cold and hot drinks',
          createdAt: '2025-10-17T15:30:07.000Z',
          updatedAt: '2025-10-17T15:30:07.000Z',
          productCount: 5
        },
        {
          id: 'f8c9b0d3-2b3c-5d4e-0f1a-2b3c4d5e6f7g',
          name: 'Snacks',
          desc: 'Light snacks and appetizers',
          createdAt: '2025-10-17T14:20:15.000Z',
          updatedAt: '2025-10-17T14:20:15.000Z',
          productCount: 0
        }
      ]
    }
  })
  async getCategoriesWithProductCounts() {
    return this.service.getCategoriesWithProductCounts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Category by id' })
  @ApiParam({ name: 'id', description: 'Category id', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Category found with timestamps',
    schema: {
      example: {
        id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        name: 'Beverages',
        desc: 'Cold and hot drinks',
        createdAt: '2025-10-17T15:30:07.000Z',
        updatedAt: '2025-10-17T15:30:07.000Z',
        products: []
      }
    }
  })
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create Category',
    description: 'Create a new category. Timestamps will be automatically generated.'
  })
  @ApiBody({ type: CreateCategoryDto, description: 'Create Category payload' })
  @ApiResponse({ 
    status: 201, 
    description: 'Category created successfully with timestamps',
    schema: {
      example: {
        id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        name: 'Beverages',
        desc: 'Cold and hot drinks',
        createdAt: '2025-10-17T15:30:07.000Z',
        updatedAt: '2025-10-17T15:30:07.000Z',
        products: []
      }
    }
  })
  async create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update Category',
    description: 'Update an existing category. updatedAt timestamp will be automatically updated.'
  })
  @ApiParam({ name: 'id', description: 'Category id', required: true })
  @ApiBody({ type: UpdateCategoryDto, description: 'Update Category payload' })
  @ApiResponse({ 
    status: 200, 
    description: 'Category updated successfully with updated timestamp',
    schema: {
      example: {
        id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        name: 'Updated Beverages',
        desc: 'Updated description',
        createdAt: '2025-10-17T15:30:07.000Z',
        updatedAt: '2025-10-17T16:15:22.000Z',
        products: []
      }
    }
  })
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
