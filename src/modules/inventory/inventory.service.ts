import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ErrorService } from '../../common/services/error.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateSubInventoryDto } from './dto/create-sub-inventory.dto';
import { UpdateSubInventoryDto } from './dto/update-sub-inventory.dto';
import { StockAdjustmentDto, AdjustmentType } from './dto/stock-adjustment.dto';
import { QuickAddInventoryDto } from './dto/quick-add-inventory.dto';

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
          minStockLevel: dto.minStockLevel,
          maxStockLevel: dto.maxStockLevel,
          lastCountedAt: dto.lastCountedAt,
          expirationDate: dto.expirationDate,
          desc: dto.desc,
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
          minStockLevel: dto.minStockLevel,
          maxStockLevel: dto.maxStockLevel,
          lastCountedAt: dto.lastCountedAt,
          expirationDate: dto.expirationDate,
          desc: dto.desc,
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
            quantity: dto.quantity,
            desc: dto.desc,
          },
          include: {
            warehouse: true,
            supplier: true,
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
          desc: dto.desc,
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

        const newQuantity = Number(subInventory.quantity) + adjustment;

        if (newQuantity < 0) {
          this.errorService.throwBusinessError('Insufficient quantity for adjustment');
        }

        // Update sub-inventory quantity
        const updated = await tx.subInventory.update({
          where: { id: dto.subInventoryId },
          data: {
            quantity: newQuantity,
          },
        });

        // Update parent inventory last counted date
        await tx.inventory.update({
          where: { id: subInventory.inventoryId },
          data: {
            lastCountedAt: new Date(),
          },
        });

        return {
          success: true,
          adjustment,
          newQuantity: Number(updated.quantity),
        };
      });
    } catch (error) {
      this.errorService.handleError(error, 'adjust stock');
    }
  }

  async getLowStockItems(threshold?: number) {
    try {
      const allInventories = await this.prisma.inventory.findMany({
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

      // Calculate total quantity from sub-inventories and filter
      const lowStockItems = allInventories
        .map((inventory) => {
          const totalQuantity = inventory.subInventories.reduce(
            (sum, sub) => sum + Number(sub.quantity),
            0,
          );
          return { ...inventory, totalQuantity };
        })
        .filter((item) => item.totalQuantity <= (threshold || 10))
        .sort((a, b) => a.totalQuantity - b.totalQuantity);

      return lowStockItems;
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

      const totalQuantity = subInventories.reduce(
        (sum, sub) => sum + Number(sub.quantity),
        0,
      );

      const totalValue = subInventories.reduce(
        (sum, sub) => sum + Number(sub.quantity) * Number(sub.unitPrice),
        0,
      );

      const avgPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;

      return {
        inventoryId,
        productName: inventory.product.name,
        totalQuantity,
        totalBatches: subInventories.length,
        averagePrice: avgPrice.toFixed(2),
        totalValue: totalValue.toFixed(2),
        stockStatus: this.getStockStatus(
          totalQuantity,
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

  // ==================== QUICK ADD INVENTORY ====================

  async quickAddInventory(dto: QuickAddInventoryDto) {
    return await this.prisma.$transaction(async (tx) => {
      try {
        // Step 1: Search for existing product by name
        let product = await tx.product.findFirst({
          where: {
            name: { equals: dto.productName, mode: 'insensitive' },
          },
          include: {
            inventory: {
              include: {
                subInventories: true,
              },
            },
          },
        });

        // Step 2: Create product if it doesn't exist
        if (!product) {
          if (!dto.categoryId || !dto.baseUnitId) {
            throw this.errorService.throwBusinessError(
              'categoryId and baseUnitId are required when creating a new product',
            );
          }

          product = await tx.product.create({
            data: {
              name: dto.productName,
              categoryId: dto.categoryId,
              stockTypeId: dto.categoryId, // Using categoryId as placeholder
              baseUnitId: dto.baseUnitId,
              description: dto.productDescription,
            },
            include: {
              inventory: {
                include: {
                  subInventories: true,
                },
              },
            },
          });
        }

        // Step 3: Create inventory if it doesn't exist
        let inventory = product.inventory;
        if (!inventory) {
          inventory = await tx.inventory.create({
            data: {
              productId: product.id,
              minStockLevel: 10, // Default value
              maxStockLevel: 1000, // Default value
              desc: dto.inventoryDesc,
            },
            include: {
              subInventories: true,
            },
          });
        }

        // Step 4: Validate batch doesn't already exist

        // Step 5: Create SubInventory (batch)
        const subInventory = await tx.subInventory.create({
          data: {
            inventoryId: inventory.id,
            quantity: dto.quantity,
            unitPrice: dto.unitPrice,
            supplierId: dto.supplierId,
            warehouseId: dto.warehouseId,
            expirationDate: dto.expirationDate,
            desc: dto.subInventoryDesc,
          },
          include: {
            warehouse: true,
            supplier: true,
          },
        });

        // Step 6: Return complete information
        const updatedInventory = await tx.inventory.findUnique({
          where: { id: inventory.id },
          include: {
            product: {
              include: {
                category: true,
                baseUnit: true,
              },
            },
            subInventories: {
              include: {
                warehouse: true,
                supplier: true,
              },
            },
          },
        });

        if (!updatedInventory) {
          throw this.errorService.throwBusinessError('Failed to retrieve updated inventory');
        }

        const totalQuantity = updatedInventory.subInventories.reduce(
          (sum, sub) => sum + Number(sub.quantity),
          0,
        );

        const wasNewProduct = !product.inventory;
        const wasNewInventory = !product.inventory;

        return {
          message: 'Inventory added successfully',
          isNewProduct: wasNewProduct,
          isNewInventory: wasNewInventory,
          inventory: updatedInventory,
          addedBatch: subInventory,
          totalQuantity,
        };
      } catch (error) {
        // Transaction will automatically rollback on error
        throw error;
      }
    });
  }

  // ==================== SEARCH OPERATIONS ====================

  async searchInventory(query: string) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        include: {
          inventory: {
            include: {
              subInventories: {
                include: {
                  warehouse: true,
                  supplier: true,
                },
              },
            },
          },
          category: true,
          baseUnit: true,
        },
      });

      // Calculate total quantities for each product
      return products.map((product) => {
        const totalQuantity = product.inventory
          ? product.inventory.subInventories.reduce(
              (sum, sub) => sum + Number(sub.quantity),
              0,
            )
          : 0;

        return {
          ...product,
          totalQuantity,
          stockStatus: product.inventory
            ? this.getStockStatus(
                totalQuantity,
                Number(product.inventory.minStockLevel),
                Number(product.inventory.maxStockLevel),
              )
            : 'NO_INVENTORY',
        };
      });
    } catch (error) {
      this.errorService.handleError(error, 'search inventory');
    }
  }
}

