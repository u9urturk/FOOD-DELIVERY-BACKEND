import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(
    private prisma: DatabaseService,
    private errorService: ErrorService,
  ) {}

  // ==================== CRUD OPERATIONS ====================

  async findAll() {
    try {
      return await this.prisma.product.findMany({
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
    } catch (e) {
      this.errorService.handleError(e, 'find all products');
    }
  }

  async findOne(id: string) {
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

      return product;
    } catch (e) {
      this.errorService.handleError(e, 'find product');
    }
  }

  async findByCategory(categoryId: string) {
    try {
      return await this.prisma.product.findMany({
        where: { categoryId },
        include: {
          category: true,
          baseUnit: true,
          inventory: {
            include: {
              stockType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      this.errorService.handleError(e, 'find products by category');
    }
  }

  async create(dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: dto,
        include: {
          category: true,
          baseUnit: true,
        },
      });

      return product;
    } catch (e) {
      this.errorService.handleError(e, 'create product');
    }
  }

  async update(id: string, dto: UpdateProductDto) {
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

      return product;
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

  async updateStatus(id: string, status: ProductStatus) {
    try {
      await this.findOne(id);

      return await this.prisma.product.update({
        where: { id },
        data: { status },
        include: {
          category: true,
          baseUnit: true,
        },
      });
    } catch (e) {
      this.errorService.handleError(e, 'update product status');
    }
  }

  async getActiveProducts() {
    try {
      return await this.prisma.product.findMany({
        where: { status: ProductStatus.ACTIVE },
        include: {
          category: true,
          baseUnit: true,
          inventory: {
            include: {
              stockType: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (e) {
      this.errorService.handleError(e, 'find active products');
    }
  }

  // ==================== SEARCH & FILTER ====================

  async search(query: string) {
    try {
      return await this.prisma.product.findMany({
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
            },
          },
        },
      });
    } catch (e) {
      this.errorService.handleError(e, 'search products');
    }
  }
}
