# 📊 Inventory Summary API Documentation

## Endpoint

```
GET /api/v1/inventory/summary/all
```

## Description

Tüm envanterlerin özet bilgilerini döndürür. Her envanter için ürün adı, barkod, minimum stok seviyesi, ortalama fiyat, son sayım zamanı ve toplam stok miktarı gibi detaylı bilgileri içerir.

## Response Structure

### Main Response Object

```typescript
{
  total: number;              // Toplam envanter sayısı
  lowStockCount: number;      // Düşük stoklu ürün sayısı
  normalStockCount: number;   // Normal stoklu ürün sayısı
  overstockedCount: number;   // Fazla stoklu ürün sayısı
  totalInventoryValue: number; // Toplam envanter değeri (TL)
  items: InventorySummaryItem[]; // Envanter detayları
}
```

### InventorySummaryItem Object

```typescript
{
  inventoryId: string;        // Envanter ID
  productId: string;          // Ürün ID
  productName: string;        // Ürün adı
  barcode: string | null;     // Barkod (varsa ilk SubInventory'den)
  minStock: number;           // Minimum stok seviyesi
  averagePrice: number;       // Ortalama birim fiyat (ağırlıklı ortalama)
  lastCountedAt: Date | null; // Son sayım tarihi
  totalStock: number;         // Toplam stok (tüm batch'lerin toplamı)
  stockStatus: string;        // "LOW" | "NORMAL" | "OVERSTOCKED"
  batchCount: number;         // Toplam batch sayısı
  category: {
    id: string;
    name: string;
  };
  baseUnit: {
    id: string;
    name: string;
    symbol: string | null;
  };
  stockType: {
    id: string;
    name: string;
    icon: string | null;
  };
}
```

## Example Response

```json
{
  "total": 25,
  "lowStockCount": 5,
  "normalStockCount": 18,
  "overstockedCount": 2,
  "totalInventoryValue": 15250.75,
  "items": [
    {
      "inventoryId": "550e8400-e29b-41d4-a716-446655440000",
      "productId": "660e8400-e29b-41d4-a716-446655440001",
      "productName": "Organic Tomatoes",
      "barcode": "1234567890123",
      "minStock": 10,
      "averagePrice": 25.50,
      "lastCountedAt": "2025-12-08T10:00:00.000Z",
      "totalStock": 150,
      "stockStatus": "NORMAL",
      "batchCount": 3,
      "category": {
        "id": "cat-123",
        "name": "Vegetables"
      },
      "baseUnit": {
        "id": "unit-123",
        "name": "Kilogram",
        "symbol": "kg"
      },
      "stockType": {
        "id": "type-123",
        "name": "Perishable",
        "icon": "🥬"
      }
    },
    {
      "inventoryId": "770e8400-e29b-41d4-a716-446655440002",
      "productId": "880e8400-e29b-41d4-a716-446655440003",
      "productName": "Fresh Chicken Breast",
      "barcode": null,
      "minStock": 20,
      "averagePrice": 45.00,
      "lastCountedAt": "2025-12-10T14:30:00.000Z",
      "totalStock": 8,
      "stockStatus": "LOW",
      "batchCount": 2,
      "category": {
        "id": "cat-456",
        "name": "Meat & Poultry"
      },
      "baseUnit": {
        "id": "unit-456",
        "name": "Kilogram",
        "symbol": "kg"
      },
      "stockType": {
        "id": "type-456",
        "name": "Frozen",
        "icon": "❄️"
      }
    }
  ]
}
```

## Business Logic

### 1. Total Stock Calculation
```typescript
totalStock = sum(subInventory.quantity) // Tüm batch'lerin toplamı
```

### 2. Average Price Calculation (Ağırlıklı Ortalama)
```typescript
totalValue = sum(subInventory.quantity × subInventory.unitPrice)
averagePrice = totalValue / totalStock
```

### 3. Stock Status Determination
```typescript
if (totalStock <= minStock) → "LOW"
if (totalStock >= maxStock) → "OVERSTOCKED"
otherwise → "NORMAL"
```

### 4. Barcode Selection
- En son oluşturulan (createdAt DESC) SubInventory'den barkod alınır
- Hiçbir SubInventory'de barkod yoksa `null` döner

## Use Cases

### 📈 Dashboard Overview
```javascript
const response = await fetch('/api/v1/inventory/summary/all');
const data = await response.json();

console.log(`Total Products: ${data.total}`);
console.log(`Low Stock Alerts: ${data.lowStockCount}`);
console.log(`Total Value: ${data.totalInventoryValue} TL`);
```

### 🔍 Filter Low Stock Items
```javascript
const lowStockItems = data.items.filter(item => item.stockStatus === 'LOW');
```

### 💰 Calculate Category Values
```javascript
const categoryValues = data.items.reduce((acc, item) => {
  const category = item.category.name;
  const value = item.totalStock * item.averagePrice;
  acc[category] = (acc[category] || 0) + value;
  return acc;
}, {});
```

### 📊 Find Most Valuable Items
```javascript
const sortedByValue = data.items
  .map(item => ({
    ...item,
    totalValue: item.totalStock * item.averagePrice
  }))
  .sort((a, b) => b.totalValue - a.totalValue);
```

## Frontend Integration Example

```typescript
// React/Vue/Angular Example
interface InventorySummary {
  total: number;
  lowStockCount: number;
  normalStockCount: number;
  overstockedCount: number;
  totalInventoryValue: number;
  items: InventorySummaryItem[];
}

async function fetchInventorySummary(): Promise<InventorySummary> {
  const response = await axios.get('/api/v1/inventory/summary/all');
  return response.data;
}

// Usage
const summary = await fetchInventorySummary();

// Display in table
summary.items.forEach(item => {
  console.log(`
    Product: ${item.productName}
    Barcode: ${item.barcode || 'N/A'}
    Stock: ${item.totalStock} ${item.baseUnit.symbol}
    Avg Price: ${item.averagePrice} TL
    Status: ${item.stockStatus}
    Last Count: ${new Date(item.lastCountedAt).toLocaleDateString()}
  `);
});
```

## Performance Considerations

- ✅ Single database query with proper `include` relations
- ✅ Calculations done in-memory (no N+1 queries)
- ✅ Ordered by `updatedAt DESC` for most recently updated items first
- ✅ SubInventories ordered by `createdAt DESC` for latest barcode first

## Related Endpoints

- `GET /api/v1/inventory` - Get all inventories with full details
- `GET /api/v1/inventory/:id` - Get single inventory by ID
- `GET /api/v1/inventory/:id/stats` - Get detailed statistics for one inventory
- `GET /api/v1/inventory/search?query=...` - Search inventories by name

## Response Time

Expected response time: **< 500ms** for ~100 inventories

## Error Handling

```typescript
try {
  const summary = await getInventoriesSummary();
} catch (error) {
  // Error will be handled by ErrorService
  // Returns appropriate HTTP status code and error message
}
```

## Notes

- 🔄 Data is fetched in real-time (no caching)
- 📅 Dates are returned in ISO-8601 format
- 💵 Prices are in Turkish Lira (TL)
- 📦 Batch count shows number of different purchase batches
- ⚠️ Stock status is recalculated for each request based on current stock levels

## Swagger Documentation

Bu endpoint Swagger UI'da şu şekilde görüntülenebilir:
```
http://localhost:3000/api/docs#/Inventory%20Management/InventoryController_getInventoriesSummary
```
