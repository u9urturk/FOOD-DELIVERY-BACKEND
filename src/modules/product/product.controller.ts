import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags('Products')
@Controller('products')
@ApiBearerAuth()
export class ProductController {
  constructor(private service: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List Products' })
  @ApiResponse({ status: 200, description: 'List of products' })
  async list() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Product by id' })
  @ApiParam({ name: 'id', description: 'Product id', required: true })
  @ApiResponse({ status: 200, description: 'Product found' })
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create Product',
    description: 'Create a new product. SKU will be auto-generated based on product name and category (Format: [PRODUCT_3CHAR]-[CATEGORY_2CHAR]-[NUMBER])'
  })
  @ApiBody({ type: CreateProductDto, description: 'Create Product payload' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product created successfully with auto-generated SKU',
    schema: {
      example: {
        id: 'e7b8a9c2-1a2b-4c3d-9e0f-1a2b3c4d5e6f',
        name: 'Cheeseburger',
        description: 'Delicious beef burger with cheese',
        sku: 'CHE-BU-001',
        status: 'ACTIVE',
        categoryId: 'b3f8a6e2-1c2d-4f5a-9e5d-0a1b2c3d4e5f',
        stockTypeId: 'd4f8b6c2-2b3c-4a5d-9e6f-1b2c3d4e5f6a',
        baseUnitId: 'a1b2c3d4-e5f6-4a3b-9c8d-0e1f2a3b4c5d',
        createdAt: '2025-10-17T10:44:51.000Z',
        updatedAt: '2025-10-17T10:44:51.000Z'
      }
    }
  })
  async create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Product' })
  @ApiParam({ name: 'id', description: 'Product id', required: true })
  @ApiBody({ type: UpdateProductDto, description: 'Update Product payload' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Product' })
  @ApiParam({ name: 'id', description: 'Product id', required: true })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
