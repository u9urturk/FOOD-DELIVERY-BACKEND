import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateStockTypeDto } from './dto/create-stock-type.dto';
import { UpdateStockTypeDto } from './dto/update-stock-type.dto';
import { StockTypeResponseDto, StockTypeListResponseDto, StockTypeStatsDto } from './dto/stock-type-response.dto';

@Injectable()
export class StockTypeService {
  constructor(private prisma: DatabaseService, private errorService: ErrorService) {}

  private calculateStockTypeStats(stockTypes: any[]): {
    totalProducts: number;
    averageProductsPerStockType: number;
    mostUsedStockType: StockTypeStatsDto;
    topStockTypes: string[];
  } {
    const totalProducts = stockTypes.reduce((sum, st) => sum + st.products.length, 0);
    const averageProductsPerStockType = stockTypes.length > 0 ? Number((totalProducts / stockTypes.length).toFixed(1)) : 0;

    const mostUsed = stockTypes.reduce((max, current) => 
      current.products.length > max.products.length ? current : max, 
      stockTypes[0] || { products: [], name: 'N/A', id: 'N/A' }
    );

    const mostUsedStockType: StockTypeStatsDto = {
      mostUsedStockTypeId: mostUsed.id,
      mostUsedStockTypeName: mostUsed.name,
      mostUsedCount: mostUsed.products.length,
      mostUsedPercentage: totalProducts > 0 ? Number(((mostUsed.products.length / totalProducts) * 100).toFixed(1)) : 0
    };

    const topStockTypes = stockTypes
      .sort((a, b) => b.products.length - a.products.length)
      .slice(0, 3)
      .map(st => `${st.name}: ${st.products.length} ürün`);

    return {
      totalProducts,
      averageProductsPerStockType,
      mostUsedStockType,
      topStockTypes
    };
  }

  async findAll(): Promise<StockTypeListResponseDto> {
    try {
      const stockTypes = await this.prisma.stockType.findMany({ 
        include: { 
          products: {
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const data = stockTypes.map(stockType => ({
        id: stockType.id,
        name: stockType.name,
        description: stockType.description || '',
        color: stockType.color || 'from-blue-500 to-blue-600',
        icon: stockType.icon || '📦',
        examples: stockType.examples || [],
        itemCount: stockType.products.length,
        isActive: stockType.isActive,
        createdAt: stockType.createdAt,
        updatedAt: stockType.updatedAt
      }));

      const total = data.length;
      const activeCount = data.filter(item => item.isActive).length;
      const inactiveCount = total - activeCount;

      // İstatistikleri hesapla
      const stats = this.calculateStockTypeStats(stockTypes);

      return {
        data,
        total,
        activeCount,
        inactiveCount,
        totalProducts: stats.totalProducts,
        averageProductsPerStockType: stats.averageProductsPerStockType,
        mostUsedStockType: stats.mostUsedStockType,
        topStockTypes: stats.topStockTypes,
        lastUpdated: new Date()
      };
    } catch (e) {
      this.errorService.handleError(e, 'liste stock types');
    }
  }

  async findOne(id: string): Promise<StockTypeResponseDto> {
    try {
      const stockType = await this.prisma.stockType.findUnique({ 
        where: { id }, 
        include: { 
          products: {
            select: { id: true }
          }
        }
      });
      
      if (!stockType) this.errorService.throwNotFound('StockType');
      
      return {
        id: stockType.id,
        name: stockType.name,
        description: stockType.description || '',
        color: stockType.color || 'from-blue-500 to-blue-600',
        icon: stockType.icon || '📦',
        examples: stockType.examples || [],
        itemCount: stockType.products.length,
        isActive: stockType.isActive,
        createdAt: stockType.createdAt,
        updatedAt: stockType.updatedAt
      };
    } catch (e) {
      this.errorService.handleError(e, 'get stock type');
    }
  }

  async findActive(): Promise<StockTypeResponseDto[]> {
    try {
      const stockTypes = await this.prisma.stockType.findMany({ 
        where: { isActive: true },
        include: { 
          products: {
            select: { id: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      return stockTypes.map(stockType => ({
        id: stockType.id,
        name: stockType.name,
        description: stockType.description || '',
        color: stockType.color || 'from-blue-500 to-blue-600',
        icon: stockType.icon || '📦',
        examples: stockType.examples || [],
        itemCount: stockType.products.length,
        isActive: stockType.isActive,
        createdAt: stockType.createdAt,
        updatedAt: stockType.updatedAt
      }));
    } catch (e) {
      this.errorService.handleError(e, 'get active stock types');
    }
  }

  async create(dto: CreateStockTypeDto): Promise<StockTypeResponseDto> {
    try {
      const stockType = await this.prisma.stockType.create({ 
        data: {
          name: dto.name,
          description: dto.description,
          color: dto.color || 'from-blue-500 to-blue-600',
          icon: dto.icon || '📦',
          examples: dto.examples || []
        },
        include: { 
          products: {
            select: { id: true }
          }
        }
      });

      return {
        id: stockType.id,
        name: stockType.name,
        description: stockType.description || '',
        color: stockType.color || 'from-blue-500 to-blue-600',
        icon: stockType.icon || '📦',
        examples: stockType.examples || [],
        itemCount: stockType.products.length,
        isActive: stockType.isActive,
        createdAt: stockType.createdAt,
        updatedAt: stockType.updatedAt
      };
    } catch (e) {
      this.errorService.handleError(e, 'create stock type');
    }
  }

  async update(id: string, dto: UpdateStockTypeDto): Promise<StockTypeResponseDto> {
    try {
      const stockType = await this.prisma.stockType.update({ 
        where: { id }, 
        data: dto,
        include: { 
          products: {
            select: { id: true }
          }
        }
      });

      return {
        id: stockType.id,
        name: stockType.name,
        description: stockType.description || '',
        color: stockType.color || 'from-blue-500 to-blue-600',
        icon: stockType.icon || '📦',
        examples: stockType.examples || [],
        itemCount: stockType.products.length,
        isActive: stockType.isActive,
        createdAt: stockType.createdAt,
        updatedAt: stockType.updatedAt
      };
    } catch (e) {
      this.errorService.handleError(e, 'update stock type');
    }
  }

  async toggleStatus(id: string): Promise<StockTypeResponseDto> {
    try {
      const currentStockType = await this.prisma.stockType.findUnique({
        where: { id }
      });

      if (!currentStockType) this.errorService.throwNotFound('StockType');

      const stockType = await this.prisma.stockType.update({
        where: { id },
        data: { isActive: !currentStockType.isActive },
        include: { 
          products: {
            select: { id: true }
          }
        }
      });

      return {
        id: stockType.id,
        name: stockType.name,
        description: stockType.description || '',
        color: stockType.color || 'from-blue-500 to-blue-600',
        icon: stockType.icon || '📦',
        examples: stockType.examples || [],
        itemCount: stockType.products.length,
        isActive: stockType.isActive,
        createdAt: stockType.createdAt,
        updatedAt: stockType.updatedAt
      };
    } catch (e) {
      this.errorService.handleError(e, 'toggle stock type status');
    }
  }

  async remove(id: string) {
    try {
      // İlişkili ürün kontrolü
      const stockTypeWithProducts = await this.prisma.stockType.findUnique({
        where: { id },
        include: { products: true }
      });

      if (!stockTypeWithProducts) this.errorService.throwNotFound('StockType');

      if (stockTypeWithProducts.products.length > 0) {
        throw new Error(`Bu stok türüne ait ${stockTypeWithProducts.products.length} ürün bulunmaktadır. Önce ürünleri başka bir stok türüne taşıyın.`);
      }

      await this.prisma.stockType.delete({ where: { id } });
      return { message: 'StockType başarıyla silindi' };
    } catch (e) {
      this.errorService.handleError(e, 'delete stock type');
    }
  }
}
