import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { StockItem } from './types/stock-business.types';


@Injectable()
export class InventoryService {
  constructor(private prisma: DatabaseService, private errorService: ErrorService) {}

  /**
   * Generate automatic lot number with format: LOT-YYYY-MMDD-XXXX
   * Example: LOT-2025-1015-0001
   */
  private async generateLotNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `LOT-${year}-${month}${day}`;

    // Get the count of inventories created today to generate sequence number
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const todayCount = await this.prisma.inventory.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const sequence = String(todayCount + 1).padStart(4, '0');
    return `${datePrefix}-${sequence}`;
  }

  async findAll(): Promise<StockItem[]> {
    try {
      const inventories = await this.prisma.inventory.findMany({ 
        include: { 
          product: {
            include: {
              category: true,
              stockType: true,
              baseUnit: true
            }
          }, 
          warehouse: true, 
          supplier: true 
        } 
      });

      // Transform data to StockItem format
      return inventories.map(inventory => ({
        id: inventory.id,
        barcode: inventory.product.barcode || undefined,
        name: inventory.product.name,
        stockType: inventory.product.stockType.name,
        unitType: inventory.product.baseUnit.name,
        quantity: Number(inventory.currentQuantity),
        minQuantity: Number(inventory.minStockLevel),
        maxQuantity: Number(inventory.maxStockLevel),
        unitPrice: Number(inventory.unitPrice),
        totalPrice: Number(inventory.currentQuantity) * Number(inventory.unitPrice),
        status: inventory.product.status === 'ACTIVE' ? 'active' : 'inactive',
        lastUpdated: inventory.updatedAt.toISOString(),
        supplier: inventory.supplier?.name || undefined,
        warehouse: inventory.warehouse?.name || undefined,
        description: inventory.product.description || undefined,
        notes: inventory.product.note || undefined,
        lotNumber: inventory.lotNumber || undefined,
        // ID'ler
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        supplierId: inventory.supplierId || undefined,
        categoryId: inventory.product.categoryId,
        stockTypeId: inventory.product.stockTypeId,
        baseUnitId: inventory.product.baseUnitId
      }));
    } catch (e) {
      this.errorService.handleError(e, 'liste inventory');
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.prisma.inventory.findUnique({ where: { id }, include: { product: true, warehouse: true, supplier: true } });
      if (!item) this.errorService.throwNotFound('Inventory');
      return item;
    } catch (e) {
      this.errorService.handleError(e, 'get inventory');
    }
  }

  /**
   * Convert date string to proper ISO DateTime format
   * Handles both "YYYY-MM-DD" and ISO formats
   */
  private formatDateForPrisma(dateString?: string): Date | undefined {
    if (!dateString) return undefined;
    
    // If already in ISO format, use as is
    if (dateString.includes('T') || dateString.includes('Z')) {
      return new Date(dateString);
    }
    
    // If just date format (YYYY-MM-DD), add time part
    return new Date(`${dateString}T00:00:00.000Z`);
  }

  async create(dto: CreateInventoryDto) {
    try {
      // Generate automatic lot number
      const lotNumber = await this.generateLotNumber();
      
      // Prepare data with proper date formatting
      const data = {
        ...dto,
        lotNumber,
        lastCountedAt: this.formatDateForPrisma(dto.lastCountedAt),
        expirationDate: this.formatDateForPrisma(dto.expirationDate),
      };
      
      // Create inventory with auto-generated lot number and formatted dates
      return await this.prisma.inventory.create({ 
        data,
        include: { 
          product: true, 
          warehouse: true, 
          supplier: true 
        }
      });
    } catch (e) {
      this.errorService.handleError(e, 'create inventory');
    }
  }

  async update(id: string, dto: UpdateInventoryDto) {
    try {
      // Prepare data with proper date formatting
      const data = {
        ...dto,
        lastCountedAt: dto.lastCountedAt ? this.formatDateForPrisma(dto.lastCountedAt) : undefined,
        expirationDate: dto.expirationDate ? this.formatDateForPrisma(dto.expirationDate) : undefined,
      };

      return await this.prisma.inventory.update({ 
        where: { id }, 
        data,
        include: {
          product: true,
          warehouse: true,
          supplier: true
        }
      });
    } catch (e) {
      this.errorService.handleError(e, 'update inventory');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.inventory.delete({ where: { id } });
      return { message: 'deleted' };
    } catch (e) {
      this.errorService.handleError(e, 'delete inventory');
    }
  }
}
