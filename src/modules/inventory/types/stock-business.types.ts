// StockBusiness Types
export interface StockItem {
    id: string;
    barcode?: string;
    name: string;
    stockType: string;
    unitType: string; 
    quantity: number;
    minQuantity: number;
    maxQuantity: number;
    unitPrice: number;
    totalPrice?: number;
    status?: "active" | "inactive";
    lastUpdated: string;
    supplier?: string;
    warehouse?: string;
    description?: string;
    notes?: string;
    lotNumber?: string;
    // ID'ler
    productId: string;
    warehouseId: string;
    supplierId?: string;
    categoryId: string;
    stockTypeId: string;
    baseUnitId: string;
}