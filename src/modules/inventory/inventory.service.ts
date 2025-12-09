import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ErrorService } from '../../common/services/error.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateSubInventoryDto } from './dto/create-sub-inventory.dto';
import { UpdateSubInventoryDto } from './dto/update-sub-inventory.dto';
import { StockAdjustmentDto, AdjustmentType } from './dto/stock-adjustment.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly errorService: ErrorService,
  ) {}

  // ==================== INVENTORY OPERATIONS ====================

  async createInventory(dto: CreateInventoryDto) {
    try {
      return await this.prisma.inventory.create({
        data: {
          productId: dto.productId,
          currentQuantity: dto.currentQuantity,
          minStockLevel: dto.minStockLevel,
          maxStockLevel: dto.maxStockLevel,
          lastCountedAt: dto.lastCountedAt,
          expirationDate: dto.expirationDate,
        },
        include: {
          product: true,
          subInventories: true,
        },
      });
    } catch (error) {
      this.errorService.handleError(error, 'create inventory');
    }
  }

  async findAllInventories() {
    try {
      return await this.prisma.inventory.findMany({
        include: {
          product: true,
          subInventories: {
            include: {
              warehouse: true,
              supplier: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.errorService.handleError(error, 'find all inventories');
    }
  }

  async findInventoryById(id: string) {
    try {
      const inventory = await this.prisma.inventory.findUnique({
        where: { id },
        include: {
          product: true,
          subInventories: {
            include: {
              warehouse: true,
              supplier: true,
            },
          },
        },
      });

      if (!inventory) {
        this.errorService.throwNotFound('Inventory not found');
      }

      return inventory;
    } catch (error) {
      this.errorService.handleError(error, 'find inventory');
    }
  }

  async findInventoryByProductId(productId: string) {
    try {
      return await this.prisma.inventory.findFirst({
        where: { productId },
        include: {
          product: true,
          subInventories: {
            include: {
              warehouse: true,
              supplier: true,
            },
          },
        },
      });
    } catch (error) {
      this.errorService.handleError(error, 'find inventory by product');
    }
  }

  async updateInventory(id: string, dto: UpdateInventoryDto) {
    try {
      await this.findInventoryById(id); // Check exists

      return await this.prisma.inventory.update({
        where: { id },
        data: {
          currentQuantity: dto.currentQuantity,
          minStockLevel: dto.minStockLevel,
          maxStockLevel: dto.maxStockLevel,
          lastCountedAt: dto.lastCountedAt,
          expirationDate: dto.expirationDate,
        },
        include: {
          product: true,
          subInventories: true,
        },
      });
    } catch (error) {
      this.errorService.handleError(error, 'update inventory');
    }
  }

  async deleteInventory(id: string) {
    try {
      await this.findInventoryById(id); // Check exists

      return await this.prisma.inventory.delete({
        where: { id },
      });
    } catch (error) {
      this.errorService.handleError(error, 'delete inventory');
    }
  }

  // ==================== SUB-INVENTORY OPERATIONS ====================

  async createSubInventory(dto: CreateSubInventoryDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create sub-inventory
        const subInventory = await tx.subInventory.create({
          data: {
            inventoryId: dto.inventoryId,
            warehouseId: dto.warehouseId,
            supplierId: dto.supplierId,
            unitPrice: dto.unitPrice,
            expirationDate: dto.expirationDate,
          },
          include: {
            warehouse: true,
            supplier: true,
          },
        });

        // Update parent inventory quantity
        await tx.inventory.update({
          where: { id: dto.inventoryId },
          data: {
            currentQuantity: { increment: dto.quantity },
          },
        });

        return subInventory;
      });
    } catch (error) {
      this.errorService.handleError(error, 'create sub-inventory');
    }
  }

  async findAllSubInventories(inventoryId?: string) {
    try {
      return await this.prisma.subInventory.findMany({
        where: inventoryId ? { inventoryId } : undefined,
        include: {
          warehouse: true,
          supplier: true,
          inventory: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.errorService.handleError(error, 'find sub-inventories');
    }
  }

  async findSubInventoryById(id: string) {
    try {
      const subInventory = await this.prisma.subInventory.findUnique({
        where: { id },
        include: {
          warehouse: true,
          supplier: true,
          inventory: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!subInventory) {
        this.errorService.throwNotFound('Sub-inventory not found');
      }

      return subInventory;
    } catch (error) {
      this.errorService.handleError(error, 'find sub-inventory');
    }
  }

  async updateSubInventory(id: string, dto: UpdateSubInventoryDto) {
    try {
      await this.findSubInventoryById(id); // Check exists

      return await this.prisma.subInventory.update({
        where: { id },
        data: {
          warehouseId: dto.warehouseId,
          supplierId: dto.supplierId,
          unitPrice: dto.unitPrice,
          expirationDate: dto.expirationDate,
        },
        include: {
          warehouse: true,
          supplier: true,
        },
      });
    } catch (error) {
      this.errorService.handleError(error, 'update sub-inventory');
    }
  }

  async deleteSubInventory(id: string) {
    try {
      await this.findSubInventoryById(id);

      return await this.prisma.subInventory.delete({
        where: { id },
      });
    } catch (error) {
      this.errorService.handleError(error, 'delete sub-inventory');
    }
  }

  // ==================== STOCK OPERATIONS ====================

  async adjustStock(dto: StockAdjustmentDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const subInventory = await tx.subInventory.findUnique({
          where: { id: dto.subInventoryId },
          include: { inventory: true },
        });

        if (!subInventory) {
          this.errorService.throwNotFound('Sub-inventory not found');
        }

        const adjustment =
          dto.type === AdjustmentType.ADD ? dto.quantity : -dto.quantity;

        // Update parent inventory
        const updated = await tx.inventory.update({
          where: { id: subInventory.inventoryId },
          data: {
            currentQuantity: { increment: adjustment },
            lastCountedAt: new Date(),
          },
        });

        return {
          success: true,
          adjustment,
          newQuantity: Number(updated.currentQuantity),
        };
      });
    } catch (error) {
      this.errorService.handleError(error, 'adjust stock');
    }
  }

  async getLowStockItems(threshold?: number) {
    try {
      return await this.prisma.inventory.findMany({
        where: {
          currentQuantity: {
            lte: threshold || 10,
          },
        },
        include: {
          product: true,
          subInventories: {
            include: {
              warehouse: true,
              supplier: true,
            },
          },
        },
        orderBy: { currentQuantity: 'asc' },
      });
    } catch (error) {
      this.errorService.handleError(error, 'get low stock items');
    }
  }

  async getInventoryStats(inventoryId: string) {
    try {
      const inventory = await this.findInventoryById(inventoryId);

      const subInventories = await this.prisma.subInventory.findMany({
        where: { inventoryId },
      });

      const totalValue = subInventories.reduce(
        (sum, sub) => sum + Number(sub.unitPrice),
        0,
      );

      const avgPrice =
        subInventories.length > 0 ? totalValue / subInventories.length : 0;

      return {
        inventoryId,
        productName: inventory.product.name,
        totalQuantity: Number(inventory.currentQuantity),
        totalBatches: subInventories.length,
        averagePrice: avgPrice.toFixed(2),
        totalValue: totalValue.toFixed(2),
        stockStatus: this.getStockStatus(
          Number(inventory.currentQuantity),
          Number(inventory.minStockLevel),
          Number(inventory.maxStockLevel),
        ),
      };
    } catch (error) {
      this.errorService.handleError(error, 'get inventory stats');
    }
  }

  // ==================== HELPER METHODS ====================

  private getStockStatus(current: number, min: number, max: number): string {
    if (current <= min) return 'LOW';
    if (current >= max) return 'OVERSTOCKED';
    return 'NORMAL';
  }
}
