import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ErrorService } from '../../common/services/error.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateSubInventoryDto } from './dto/create-sub-inventory.dto';
import { UpdateSubInventoryDto } from './dto/update-sub-inventory.dto';
import { StockAdjustmentDto, AdjustmentType } from './dto/stock-adjustment.dto';
import { QuickAddInventoryDto } from './dto/quick-add-inventory.dto';
import { InventorySummaryResponseDto, InventorySummaryItemDto } from './dto/inventory-summary-response.dto';

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
          stockTypeId: dto.stockTypeId,
          minStockLevel: dto.minStockLevel,
          maxStockLevel: dto.maxStockLevel,
          lastCountedAt: dto.lastCountedAt || null,
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
            expirationDate: dto.expirationDate || null,
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

  // ==================== PRODUCT EXISTENCE CHECK ====================

  /**
   * Check if product exists by barcode (in SubInventory) or name (in Product)
   * Returns product and inventory information if found
   */
  async checkProductExists(productName?: string, barcode?: string) {
    try {
      if (!productName && !barcode) {
        this.errorService.throwBusinessError(
          'Either productName or barcode must be provided',
        );
      }

      let product: any = null;
      let matchedSubInventory: any = null;

      // Priority 1: Search by barcode in SubInventory (most specific)
      if (barcode) {
        matchedSubInventory = await this.prisma.subInventory.findFirst({
          where: { barcode: barcode },
          include: {
            inventory: {
              include: {
                product: {
                  include: {
                    category: true,
                    baseUnit: true,
                  },
                },
                stockType: true,
                subInventories: {
                  include: {
                    warehouse: true,
                    supplier: true,
                  },
                  orderBy: {
                    expirationDate: 'asc', // FIFO için sıralama
                  },
                },
              },
            },
            warehouse: true,
            supplier: true,
          },
        });

        if (matchedSubInventory) {
          product = matchedSubInventory.inventory.product;
          const totalQuantity = this.calculateTotalQuantity(
            matchedSubInventory.inventory.subInventories,
          );

          return {
            exists: true,
            matchedBy: 'barcode',
            matchedBatch: {
              id: matchedSubInventory.id,
              barcode: matchedSubInventory.barcode,
              quantity: Number(matchedSubInventory.quantity),
              unitPrice: Number(matchedSubInventory.unitPrice),
              warehouse: matchedSubInventory.warehouse,
              supplier: matchedSubInventory.supplier,
              expirationDate: matchedSubInventory.expirationDate,
            },
            product: {
              id: product.id,
              name: product.name,
              description: product.description,
              category: product.category,
              baseUnit: product.baseUnit,
              stockType: product.stockType,
              status: product.status,
            },
            inventory: {
              id: matchedSubInventory.inventory.id,
              productId: matchedSubInventory.inventory.productId,
              totalQuantity,
              minStockLevel: Number(matchedSubInventory.inventory.minStockLevel),
              maxStockLevel: Number(matchedSubInventory.inventory.maxStockLevel),
              lastCountedAt: matchedSubInventory.inventory.lastCountedAt,
              expirationDate: matchedSubInventory.inventory.expirationDate,
              stockStatus: this.getStockStatus(
                totalQuantity,
                Number(matchedSubInventory.inventory.minStockLevel),
                Number(matchedSubInventory.inventory.maxStockLevel),
              ),
              batchCount: matchedSubInventory.inventory.subInventories.length,
              batches: matchedSubInventory.inventory.subInventories.map((sub) => ({
                id: sub.id,
                barcode: sub.barcode,
                quantity: Number(sub.quantity),
                unitPrice: Number(sub.unitPrice),
                warehouse: sub.warehouse,
                supplier: sub.supplier,
                expirationDate: sub.expirationDate,
                createdAt: sub.createdAt,
              })),
            },
            hasInventory: true,
            canAddBatch: true, // true - direkt batch eklenebilir
            needsInventoryCreation: false,
            message: 'Barcode found in existing batch. You can add more stock to this product.',
          };
        }
      }

      // Priority 2: Search by product name (less specific, may have multiple matches)
      if (productName && !product) {
        const products = await this.prisma.product.findMany({
          where: {
            name: { equals: productName, mode: 'insensitive' },
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
                  orderBy: {
                    expirationDate: 'asc',
                  },
                },
              },
            },
          },
        });

        if (products.length > 0) {
          // Eğer birden fazla eşleşme varsa, ilkini döndür ve uyarı ver
          product = products[0];

          const totalQuantity = this.calculateTotalQuantity(
            product.inventory?.subInventories || [],
          );

          return {
            exists: true,
            matchedBy: 'productName',
            multipleMatches: products.length > 1,
            matchCount: products.length,
            product: {
              id: product.id,
              name: product.name,
              description: product.description,
              category: product.category,
              baseUnit: product.baseUnit,
              stockType: product.stockType,
              status: product.status,
            },
            inventory: product.inventory
              ? {
                  id: product.inventory.id,
                  productId: product.inventory.productId,
                  totalQuantity,
                  minStockLevel: Number(product.inventory.minStockLevel),
                  maxStockLevel: Number(product.inventory.maxStockLevel),
                  lastCountedAt: product.inventory.lastCountedAt,
                  expirationDate: product.inventory.expirationDate,
                  stockStatus: this.getStockStatus(
                    totalQuantity,
                    Number(product.inventory.minStockLevel),
                    Number(product.inventory.maxStockLevel),
                  ),
                  batchCount: product.inventory.subInventories.length,
                  batches: product.inventory.subInventories.map((sub) => ({
                    id: sub.id,
                    barcode: sub.barcode,
                    quantity: Number(sub.quantity),
                    unitPrice: Number(sub.unitPrice),
                    warehouse: sub.warehouse,
                    supplier: sub.supplier,
                    expirationDate: sub.expirationDate,
                    createdAt: sub.createdAt,
                  })),
                }
              : null,
            hasInventory: !!product.inventory,
            canAddBatch: !!product.inventory,
            needsInventoryCreation: !product.inventory,
            warning:
              products.length > 1
                ? `Found ${products.length} products with similar names. Showing first match.`
                : null,
            message: product.inventory
              ? 'Product found with existing inventory. You can add a new batch.'
              : 'Product found but no inventory exists. Create inventory first.',
            // Diğer eşleşmeleri de döndür (opsiyonel)
            otherMatches:
              products.length > 1
                ? products.slice(1).map((p) => ({
                    id: p.id,
                    name: p.name,
                    hasInventory: !!p.inventory,
                  }))
                : [],
          };
        }
      }

      // No match found
      return {
        exists: false,
        matchedBy: null,
        product: null,
        inventory: null,
        hasInventory: false,
        canAddBatch: false,
        needsInventoryCreation: false,
        needsProductCreation: true,
        message: 'Product not found. You can create a new product with inventory.',
      };
    } catch (error) {
      this.errorService.handleError(error, 'check product exists');
    }
  }

  /**
   * Helper: Calculate total quantity from sub-inventories
   */
  private calculateTotalQuantity(subInventories: any[]): number {
    return subInventories.reduce((sum, sub) => sum + Number(sub.quantity), 0);
  }

  // ==================== QUICK ADD INVENTORY ====================

  async quickAddInventory(dto: QuickAddInventoryDto) {
    return await this.prisma.$transaction(async (tx) => {
      try {
        // Step 1: Check if barcode already exists in SubInventory
        if (dto.barcode) {
          const existingBatch = await tx.subInventory.findFirst({
            where: { barcode: dto.barcode },
          });

          if (existingBatch) {
            throw this.errorService.throwBusinessError(
              `Barcode ${dto.barcode} already exists in the system. Please use check-product endpoint first.`,
            );
          }
        }

        // Step 2: Search for existing product by name
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

        // Step 3: Create product if it doesn't exist
        if (!product) {
          if (!dto.categoryId || !dto.baseUnitId || !dto.stockTypeId) {
            throw this.errorService.throwBusinessError(
              'categoryId, baseUnitId, and stockTypeId are required when creating a new product',
            );
          }

          product = await tx.product.create({
            data: {
              name: dto.productName,
              categoryId: dto.categoryId,
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

        // Step 4: Create inventory if it doesn't exist
        let inventory = product.inventory;
        if (!inventory) {
          if (!dto.stockTypeId) {
            throw this.errorService.throwBusinessError(
              'stockTypeId is required when creating a new inventory',
            );
          }
          
          inventory = await tx.inventory.create({
            data: {
              productId: product.id,
              stockTypeId: dto.stockTypeId,
              minStockLevel: dto.minStockLevel || 10,
              maxStockLevel: dto.maxStockLevel || 1000,
              lastCountedAt: dto.lastCountedAt,
              desc: dto.inventoryDesc,
            },
            include: {
              subInventories: true,
            },
          });
        } else {
          // Update inventory levels if provided
          if (dto.minStockLevel || dto.maxStockLevel || dto.lastCountedAt) {
            inventory = await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                minStockLevel: dto.minStockLevel ?? inventory.minStockLevel,
                maxStockLevel: dto.maxStockLevel ?? inventory.maxStockLevel,
                lastCountedAt: dto.lastCountedAt ?? inventory.lastCountedAt,
              },
              include: {
                subInventories: true,
              },
            });
          }
        }

        // Step 5: Create SubInventory (batch) with barcode
        const subInventory = await tx.subInventory.create({
          data: {
            inventoryId: inventory.id,
            barcode: dto.barcode || null,
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
            stockType: true,
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

  // ==================== INVENTORY SUMMARY ====================

  /**
   * Get comprehensive summary of all inventories with key metrics
   * Returns: productName, barcode, minStock, averagePrice, lastCountedAt, totalStock
   */
  async getInventoriesSummary(): Promise<InventorySummaryResponseDto> {
    try {
      // Fetch all inventories with related data
      const inventories = await this.prisma.inventory.findMany({
        include: {
          product: {
            include: {
              category: true,
              baseUnit: true,
            },
          },
          stockType: true,
          subInventories: {
            include: {
              warehouse: true,
              supplier: true,
            },
            orderBy: {
              createdAt: 'desc', // En son eklenen batch'i önce getir
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Process each inventory to calculate metrics
      const items: InventorySummaryItemDto[] = inventories.map((inventory) => {
        // Calculate total stock (sum of all SubInventory quantities)
        const totalStock = inventory.subInventories.reduce(
          (sum, sub) => sum + Number(sub.quantity),
          0,
        );

        // Calculate average price (weighted average based on quantities)
        let averagePrice = 0;
        if (inventory.subInventories.length > 0) {
          const totalValue = inventory.subInventories.reduce(
            (sum, sub) => sum + Number(sub.quantity) * Number(sub.unitPrice),
            0,
          );
          averagePrice = totalStock > 0 ? totalValue / totalStock : 0;
        }

        // Get barcode from first SubInventory (most recent batch)
        const barcode =
          inventory.subInventories.find((sub) => sub.barcode)?.barcode || null;

        // Calculate stock status
        const stockStatus = this.getStockStatus(
          totalStock,
          Number(inventory.minStockLevel),
          Number(inventory.maxStockLevel),
        );

        return {
          inventoryId: inventory.id,
          productId: inventory.product.id,
          productName: inventory.product.name,
          barcode,
          minStock: Number(inventory.minStockLevel),
          averagePrice: Number(averagePrice.toFixed(2)),
          lastCountedAt: inventory.lastCountedAt,
          totalStock: Number(totalStock),
          stockStatus,
          batchCount: inventory.subInventories.length,
          category: {
            id: inventory.product.category.id,
            name: inventory.product.category.name,
          },
          baseUnit: {
            id: inventory.product.baseUnit.id,
            name: inventory.product.baseUnit.name,
            symbol: inventory.product.baseUnit.symbol,
          },
          stockType: {
            id: inventory.stockType.id,
            name: inventory.stockType.name,
            icon: inventory.stockType.icon,
          },
        };
      });

      // Calculate summary statistics
      const lowStockCount = items.filter((item) => item.stockStatus === 'LOW').length;
      const normalStockCount = items.filter((item) => item.stockStatus === 'NORMAL').length;
      const overstockedCount = items.filter((item) => item.stockStatus === 'OVERSTOCKED').length;

      // Calculate total inventory value
      const totalInventoryValue = items.reduce(
        (sum, item) => sum + item.averagePrice * item.totalStock,
        0,
      );

      return {
        total: items.length,
        lowStockCount,
        normalStockCount,
        overstockedCount,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
        items,
      };
    } catch (error) {
      this.errorService.handleError(error, 'get inventories summary');
    }
  }
}

