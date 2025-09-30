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
  @ApiOperation({ summary: 'Create Product' })
  @ApiBody({ type: CreateProductDto, description: 'Create Product payload' })
  @ApiResponse({ status: 201, description: 'Product created' })
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
