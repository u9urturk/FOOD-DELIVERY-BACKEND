export class InventorySummaryDto {
    id: string;
    minStockLevel: string;
    maxStockLevel: string;
    totalQuantity: string;
    totalValue: string;
    subInventoryCount: number;
}

export class ProductResponseDto {
    id: string;
    name: string;
    description: string;
    status: string;
    categoryId: string;
    categoryName: string;
    baseUnitId: string;
    baseUnitName: string;
    baseUnitSymbol: string;
    inventory?: InventorySummaryDto;
    createdAt: Date;
    updatedAt: Date;
}
