import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: DatabaseService, private errorService: ErrorService) {}

  async findAll() {
    try {
      return await this.prisma.category.findMany({ 
        include: { products: true },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      this.errorService.handleError(e, 'liste categories');
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.prisma.category.findUnique({ 
        where: { id }, 
        include: { products: true } 
      });
      if (!item) this.errorService.throwNotFound('Category');
      return item;
    } catch (e) {
      this.errorService.handleError(e, 'get category');
    }
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ 
        data: dto,
        include: { products: true }
      });
    } catch (e) {
      this.errorService.handleError(e, 'create category');
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({ 
        where: { id }, 
        data: dto,
        include: { products: true }
      });
    } catch (e) {
      this.errorService.handleError(e, 'update category');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.category.delete({ where: { id } });
      return { message: 'deleted' };
    } catch (e) {
      this.errorService.handleError(e, 'delete category');
    }
  }

  /**
   * Get category statistics
   * Returns count of categories with products and empty categories
   */
  async getStats() {
    try {
      // Total kategori sayısı
      const totalCategories = await this.prisma.category.count();
      
      // Ürünü olan kategoriler (en az 1 ürünü olan)
      const categoriesWithProducts = await this.prisma.category.count({
        where: {
          products: {
            some: {} // En az bir ürünü var
          }
        }
      });
      
      // Boş kategoriler (hiç ürünü olmayan)
      const emptyCategories = totalCategories - categoriesWithProducts;
      
      return {
        totalCategories,
        categoriesWithProducts,
        emptyCategories
      };
    } catch (e) {
      this.errorService.handleError(e, 'get category stats');
    }
  }

  /**
   * Get categories with their product counts
   * Useful for detailed analytics
   */
  async getCategoriesWithProductCounts() {
    try {
      const categories = await this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          desc: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return categories.map(category => ({
        ...category,
        productCount: category._count.products
      }));
    } catch (e) {
      this.errorService.handleError(e, 'get categories with product counts');
    }
  }
}
