import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(
    private prisma: DatabaseService,
    private errorService: ErrorService,
  ) { }

  // ==================== HELPER METHODS ====================

  private transformToResponse(product: any): ProductResponseDto {
    const response: ProductResponseDto = {
      id: product.id,
      name: product.name,
      description: product.description,
      status: product.status,
      categoryId: product.categoryId,
      categoryName: product.category?.name || '',
      baseUnitId: product.baseUnitId,
      baseUnitName: product.baseUnit?.name || '',
      baseUnitSymbol: product.baseUnit?.symbol || '',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    if (product.inventory) {
      // Calculate totals from subInventories
      const totalQuantity = product.inventory.subInventories?.reduce(
        (sum: number, sub: any) => sum + parseFloat(sub.quantity || '0'),
        0,
      ) || 0;

      const totalValue = product.inventory.subInventories?.reduce(
        (sum: number, sub: any) => sum + (parseFloat(sub.quantity || '0') * parseFloat(sub.unitPrice || '0')),
        0,
      ) || 0;

      response.inventory = {
        id: product.inventory.id,
        minStockLevel: product.inventory.minStockLevel,
        maxStockLevel: product.inventory.maxStockLevel,
        totalQuantity: totalQuantity,
        totalValue: totalValue,
        subInventoryCount: product.inventory.subInventories?.length || 0,
      };
    }

    return response;
  }

  // ==================== CRUD OPERATIONS ====================

  async findAll(): Promise<ProductResponseDto[]> {
    try {
      const products = await this.prisma.product.findMany({
        include: {
          category: true,
          baseUnit: true,
          inventory: {
            include: {
              stockType: true,
              subInventories: {
                include: {
                  warehouse: true,
                  supplier: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return products.map(product => this.transformToResponse(product));
    } catch (e) {
      this.errorService.handleError(e, 'find all products');
    }
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          baseUnit: true,
          inventory: {
            include: {
              stockType: true,
              subInventories: {
                include: {
                  warehouse: true,
                  supplier: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        this.errorService.throwNotFound('Product not found');
      }

      return this.transformToResponse(product);
    } catch (e) {
      this.errorService.handleError(e, 'find product');
    }
  }

  async findByCategory(categoryId: string): Promise<ProductResponseDto[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: { categoryId },
        include: {
          category: true,
          baseUnit: true,
          inventory: {
            include: {
              stockType: true,
              subInventories: {
                include: {
                  warehouse: true,
                  supplier: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return products.map(product => this.transformToResponse(product));
    } catch (e) {
      this.errorService.handleError(e, 'find products by category');
    }
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.create({
        data: dto,
        include: {
          category: true,
          baseUnit: true,
        },
      });

      return this.transformToResponse(product);
    } catch (e) {
      this.errorService.handleError(e, 'create product');
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    try {
      await this.findOne(id); // Check if exists

      const product = await this.prisma.product.update({
        where: { id },
        data: dto,
        include: {
          category: true,
          baseUnit: true,
        },
      });

      return this.transformToResponse(product);
    } catch (e) {
      this.errorService.handleError(e, 'update product');
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id); // Check if exists

      await this.prisma.product.delete({ where: { id } });

      return { success: true, message: 'Product deleted successfully' };
    } catch (e) {
      this.errorService.handleError(e, 'delete product');
    }
  }

  // ==================== STATUS OPERATIONS ====================

  async updateStatus(id: string, status: ProductStatus): Promise<ProductResponseDto> {
    try {
      await this.findOne(id);

      const product = await this.prisma.product.update({
        where: { id },
        data: { status },
        include: {
          category: true,
          baseUnit: true,
        },
      });

      return this.transformToResponse(product);
    } catch (e) {
      this.errorService.handleError(e, 'update product status');
    }
  }

  async getActiveProducts(): Promise<ProductResponseDto[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: { status: ProductStatus.ACTIVE },
        include: {
          category: true,
          baseUnit: true,
          inventory: {
            include: {
              stockType: true,
              subInventories: {
                include: {
                  warehouse: true,
                  supplier: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return products.map(product => this.transformToResponse(product));
    } catch (e) {
      this.errorService.handleError(e, 'find active products');
    }
  }

  // ==================== SEARCH & FILTER ====================

  async search(query: string): Promise<ProductResponseDto[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          category: true,
          baseUnit: true,
          inventory: {
            include: {
              stockType: true,
              subInventories: {
                include: {
                  warehouse: true,
                  supplier: true,
                },
              },
            },
          },
        },
      });

      return products.map(product => this.transformToResponse(product));
    } catch (e) {
      this.errorService.handleError(e, 'search products');
    }
  }
}
