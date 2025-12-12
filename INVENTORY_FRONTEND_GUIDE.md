# Envanter Yönetimi - Frontend Geliştirme Kılavuzu

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [API Endpointleri](#api-endpointleri)
3. [Veri Modelleri](#veri-modelleri)
4. [Kullanım Senaryoları](#kullanım-senaryoları)
5. [Önerilen UI/UX Akışları](#önerilen-uiux-akışları)
6. [Hata Yönetimi](#hata-yönetimi)
7. [Best Practices](#best-practices)

---

## 🎯 Genel Bakış

Bu backend sistemi **2 katmanlı envanter yapısı** kullanmaktadır:

### 1. **Inventory (Ana Envanter)**
- Her ürün için **tek bir** Inventory kaydı bulunur
- Ürünün genel envanter bilgilerini tutar (min/max stok seviyeleri, son sayım tarihi)
- Toplam stok miktarı, bağlı SubInventory kayıtlarının toplamından hesaplanır

### 2. **SubInventory (Alt Envanter / Batch / Lot)**
- Her sevkiyat/parti için **ayrı bir** SubInventory kaydı oluşturulur
- Tedarikçi, depo, fiyat, son kullanma tarihi gibi batch-specific bilgileri içerir
- FIFO/FEFO stok yönetimi için kullanılır

---

## 🔌 API Endpointleri

### Base URL
```
http://localhost:3000/api/v1/inventory
```

### 1. **Hızlı Envanter Ekleme** ⭐ (ÖNERİLEN)

**Endpoint:** `POST /api/v1/inventory/quick-add`

**Açıklama:** Tek bir işlemde ürün arama/oluşturma, envanter oluşturma ve batch ekleme yapar. **Transaction tabanlıdır** - hata durumunda tüm işlem geri alınır.

**Ne Zaman Kullanılır:**
- Kullanıcı yeni ürün/envanter eklemek istediğinde
- Mevcut ürüne yeni batch eklemek istediğinde
- Hızlı veri girişi yaparken

**Request Body:**
```json
{
  "productName": "Domates",                          // [ZORUNLU] Ürün adı
  "categoryId": "550e8400-e29b-41d4-a716-446655440000", // [OPSİYONEL] Yeni ürün için gerekli (UUID)
  "baseUnitId": "550e8400-e29b-41d4-a716-446655440001", // [OPSİYONEL] Yeni ürün için gerekli (UUID)
  "productDescription": "Organik domates",           // [OPSİYONEL] Ürün açıklaması
  "inventoryDesc": "Premium kalite batch",           // [OPSİYONEL] Envanter notu
  "quantity": 100,                                   // [ZORUNLU] Miktar
  "unitPrice": 2.5,                                  // [ZORUNLU] Birim fiyat
  "supplierId": "550e8400-e29b-41d4-a716-446655440002", // [ZORUNLU] Tedarikçi ID (UUID)
  "warehouseId": "550e8400-e29b-41d4-a716-446655440003", // [ZORUNLU] Depo ID (UUID)
  "expirationDate": "2025-12-31T23:59:59.000Z",      // [OPSİYONEL] Son kullanma tarihi
  "subInventoryDesc": "Batch #123 - Mükemmel durum"  // [OPSİYONEL] Batch notu
}
```

**Response (201 Created):**
```json
{
  "message": "Inventory added successfully",
  "isNewProduct": true,           // Yeni ürün mü oluşturuldu?
  "isNewInventory": true,         // Yeni envanter kaydı mı oluşturuldu?
  "inventory": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "productId": 1,
    "minStockLevel": 10,
    "maxStockLevel": 1000,
    "product": {
      "id": 1,
      "name": "Domates",
      "category": { "id": 1, "name": "Sebze" },
      "baseUnit": { "id": 1, "name": "Kilogram" }
    },
    "subInventories": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "quantity": 100,
        "unitPrice": 2.5,
        "expirationDate": "2025-12-31T23:59:59.000Z",
        "warehouse": { "id": 1, "name": "Ana Depo" },
        "supplier": { "id": 1, "name": "ABC Tedarik" }
      }
    ]
  },
  "addedBatch": { /* Eklenen batch detayları */ },
  "totalQuantity": 100
}
```

**Hata Durumları:**
- **400 Bad Request:** Yeni ürün için categoryId/baseUnitId eksik
- **400 Bad Request:** Validasyon hatası

---

### 2. **Envanter Arama**

**Endpoint:** `GET /api/v1/inventory/search?query={searchTerm}`

**Açıklama:** Ürün adına göre arama yapar (case-insensitive)

**Query Parameters:**
- `query` (string): Arama terimi (ürün adı)

**Örnek İstek:**
```
GET /api/v1/inventory/search?query=domates
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Domates",
    "category": { "id": 1, "name": "Sebze" },
    "baseUnit": { "id": 1, "name": "Kilogram" },
    "inventory": {
      "id": "550e8400-...",
      "minStockLevel": 10,
      "maxStockLevel": 1000,
      "subInventories": [
        {
          "id": "660e8400-...",
          "quantity": 100,
          "unitPrice": 2.5,
          "warehouse": { "id": 1, "name": "Ana Depo" },
          "supplier": { "id": 1, "name": "ABC Tedarik" }
        }
      ]
    },
    "totalQuantity": 100,
    "stockStatus": "NORMAL"  // LOW | NORMAL | OVERSTOCKED | NO_INVENTORY
  }
]
```

---

### 3. **Ana Envanter İşlemleri**

#### 3.1 Envanter Oluşturma
**Endpoint:** `POST /api/v1/inventory`

```json
{
  "productId": 1,
  "minStockLevel": 10,
  "maxStockLevel": 1000,
  "lastCountedAt": "2025-12-10T10:00:00.000Z",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "desc": "Premium kalite batch"
}
```

#### 3.2 Tüm Envanterleri Listeleme
**Endpoint:** `GET /api/v1/inventory`

#### 3.3 Envanter Detayı
**Endpoint:** `GET /api/v1/inventory/{inventoryId}`

#### 3.4 Envanter Güncelleme
**Endpoint:** `PUT /api/v1/inventory/{inventoryId}`

#### 3.5 Envanter Silme
**Endpoint:** `DELETE /api/v1/inventory/{inventoryId}`

---

### 4. **Alt Envanter (Batch) İşlemleri**

#### 4.1 Batch Oluşturma
**Endpoint:** `POST /api/v1/inventory/sub`

```json
{
  "inventoryId": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 100,
  "unitPrice": 2.5,
  "supplierId": "550e8400-e29b-41d4-a716-446655440002",
  "warehouseId": "550e8400-e29b-41d4-a716-446655440003",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "desc": "Batch #123"
}
```

#### 4.2 Batch Listeleme
**Endpoint:** `GET /api/v1/inventory/sub?inventoryId={inventoryId}`

#### 4.3 Batch Güncelleme
**Endpoint:** `PUT /api/v1/inventory/sub/{subInventoryId}`

#### 4.4 Batch Silme
**Endpoint:** `DELETE /api/v1/inventory/sub/{subInventoryId}`

---

### 5. **Stok Ayarlama**

**Endpoint:** `POST /api/v1/inventory/adjust`

**Açıklama:** Belirli bir batch'in stok miktarını artırır veya azaltır

```json
{
  "subInventoryId": "660e8400-e29b-41d4-a716-446655440001",
  "type": "ADD",        // "ADD" veya "SUBTRACT"
  "quantity": 50,
  "reason": "Satış iadesi"
}
```

**Response:**
```json
{
  "message": "Stock adjusted successfully",
  "adjustment": {
    "type": "ADD",
    "quantity": 50,
    "reason": "Satış iadesi"
  },
  "previousQuantity": 100,
  "newQuantity": 150
}
```

---

### 6. **Raporlama**

#### 6.1 Düşük Stok Raporu
**Endpoint:** `GET /api/v1/inventory/reports/low-stock?threshold={number}`

```json
[
  {
    "inventoryId": "550e8400-...",
    "productName": "Domates",
    "totalQuantity": 5,
    "minStockLevel": 10,
    "status": "LOW",
    "deficit": 5
  }
]
```

#### 6.2 Envanter İstatistikleri
**Endpoint:** `GET /api/v1/inventory/stats/{inventoryId}`

```json
{
  "inventoryId": "550e8400-...",
  "productName": "Domates",
  "totalQuantity": 250,
  "totalBatches": 3,
  "averagePrice": "2.75",
  "totalValue": "687.50",
  "stockStatus": "NORMAL"
}
```

---

## 📊 Veri Modelleri

### Inventory (Ana Envanter)
```typescript
interface Inventory {
  id: string;                    // UUID
  productId: number;             // İlişkili ürün ID
  minStockLevel: Decimal;        // Minimum stok seviyesi
  maxStockLevel: Decimal;        // Maksimum stok seviyesi
  lastCountedAt: Date | null;    // Son sayım tarihi
  expirationDate: Date | null;   // Genel son kullanma tarihi
  desc: string | null;           // Açıklama/Not
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  product: Product;
  subInventories: SubInventory[];
}
```

### SubInventory (Alt Envanter / Batch)
```typescript
interface SubInventory {
  id: string;                    // UUID
  inventoryId: string;           // Bağlı olduğu ana envanter ID
  quantity: Decimal;             // Batch miktarı
  unitPrice: Decimal;            // Birim fiyat
  supplierId: number;            // Tedarikçi ID
  warehouseId: number;           // Depo ID
  stockTypeId: number;           // Stok tipi ID
  barcode: string | null;        // Batch barkodu
  expirationDate: Date | null;   // Son kullanma tarihi
  desc: string | null;           // Batch açıklaması
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  inventory: Inventory;
  warehouse: Warehouse;
  supplier: Supplier;
  stockType: StockType;
}
```

### StockStatus (Stok Durumu)
```typescript
type StockStatus = 'LOW' | 'NORMAL' | 'OVERSTOCKED' | 'NO_INVENTORY';
```

---

## 🎬 Kullanım Senaryoları

### Senaryo 1: Yeni Ürün ve Envanter Ekleme

**Kullanıcı Akışı:**
1. Kullanıcı "Yeni Envanter Ekle" butonuna tıklar
2. Form açılır (ürün adı, barkod, miktar, fiyat, vb.)
3. Kullanıcı formu doldurur
4. "Kaydet" butonuna tıklar

**Frontend İşlemi:**
```javascript
async function addNewInventory(formData) {
  try {
    const response = await fetch('/api/v1/inventory/quick-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: formData.productName,
        categoryId: formData.categoryId,      // Yeni ürün için (UUID)
        baseUnitId: formData.baseUnitId,      // Yeni ürün için (UUID)
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        supplierId: formData.supplierId,      // UUID
        warehouseId: formData.warehouseId,    // UUID
        expirationDate: formData.expirationDate,
        subInventoryDesc: formData.notes
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Başarı mesajı göster
      if (data.isNewProduct) {
        showNotification('Yeni ürün ve envanter başarıyla oluşturuldu!', 'success');
      } else {
        showNotification('Mevcut ürüne yeni batch eklendi!', 'success');
      }
      
      // Liste sayfasına yönlendir veya formu temizle
      redirectToInventoryList();
    }
  } catch (error) {
    handleError(error);
  }
}
```

---

### Senaryo 2: Mevcut Ürüne Batch Ekleme

**Kullanıcı Akışı:**
1. Kullanıcı arama kutusuna ürün adı yazar
2. Arama sonuçları listelenir
3. Kullanıcı "Batch Ekle" butonuna tıklar
4. Sadece batch bilgileri sorulur (miktar, fiyat, tedarikçi, vb.)
5. "Kaydet" butonuna tıklar

**Frontend İşlemi:**
```javascript
async function searchAndAddBatch() {
  // 1. Ürün ara
  const searchResults = await fetch(
    `/api/v1/inventory/search?query=${encodeURIComponent(searchTerm)}`
  ).then(res => res.json());
  
  // 2. Kullanıcı listeden seçim yapar
  const selectedProduct = searchResults[0];
  
  // 3. Quick-add ile batch ekle (ürün bilgileri zaten mevcut)
  const response = await fetch('/api/v1/inventory/quick-add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productName: selectedProduct.name,  // Mevcut ürün adı
      // categoryId ve baseUnitId GEREKLİ DEĞİL (ürün zaten var)
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      supplierId: formData.supplierId,
      warehouseId: formData.warehouseId,
      expirationDate: formData.expirationDate
    })
  });
  
  const data = await response.json();
  // data.isNewProduct === false olmalı
}
```

---

### Senaryo 3: Stok Ayarlama (Ekleme/Çıkarma)

**Kullanıcı Akışı:**
1. Kullanıcı envanter detay sayfasındadır
2. Batch listesinde bir batch seçer
3. "Stok Ayarla" butonuna tıklar
4. Popup açılır: Tip (Ekle/Çıkar), Miktar, Sebep
5. "Kaydet" butonuna tıklar

**Frontend İşlemi:**
```javascript
async function adjustStock(subInventoryId, adjustment) {
  const response = await fetch('/api/v1/inventory/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subInventoryId: subInventoryId,
      type: adjustment.type,      // "ADD" veya "SUBTRACT"
      quantity: adjustment.quantity,
      reason: adjustment.reason
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    showNotification(
      `Stok ${adjustment.type === 'ADD' ? 'eklendi' : 'çıkarıldı'}: ` +
      `${data.previousQuantity} → ${data.newQuantity}`,
      'success'
    );
    refreshInventoryDisplay();
  }
}
```

---

## 🎨 Önerilen UI/UX Akışları

### 1. Ana Envanter Listesi Sayfası

**Görünüm Önerileri:**
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Ara...] [+ Yeni Envanter] [📊 Raporlar] [⚙️ Ayarlar]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🍅 Domates                    [Düzenle] [Batch Ekle]│   │
│  │ Toplam Stok: 250 kg          Stok Durumu: ✅ NORMAL  │   │
│  │ Batch Sayısı: 3              Ortalama: 2.75 ₺/kg    │   │
│  │                                                       │   │
│  │ 📦 Batchler:                                          │   │
│  │   • Batch #1: 100 kg @ 2.50₺ | ABC Tedarik | Ana Depo│   │
│  │   • Batch #2: 100 kg @ 2.75₺ | XYZ Tedarik | 2.Depo │   │
│  │   • Batch #3:  50 kg @ 3.00₺ | ABC Tedarik | Ana Depo│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🥬 Marul                      [Düzenle] [Batch Ekle]│   │
│  │ Toplam Stok: 5 kg            Stok Durumu: ⚠️ DÜŞÜK   │   │
│  │ ...                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Önemli Özellikler:**
- Gerçek zamanlı arama (productName)
- Stok durumu renk kodlaması (Kırmızı: DÜŞÜK, Yeşil: NORMAL, Sarı: FAZLA)
- Her ürün için batch özeti göster
- Hızlı işlem butonları (Batch Ekle, Düzenle)

---

### 2. Hızlı Envanter Ekleme Formu

**Smart Form Approach:**

```javascript
// Dinamik form - Ürün durumuna göre alanları göster/gizle
function QuickAddForm() {
  const [productExists, setProductExists] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Kullanıcı yazdıkça ara
  useEffect(() => {
    if (searchTerm.length >= 3) {
      debounceSearch(searchTerm);
    }
  }, [searchTerm]);
  
  async function debounceSearch(query) {
    const results = await fetch(
      `/api/v1/inventory/search?query=${query}`
    ).then(res => res.json());
    
    if (results.length > 0) {
      setProductExists(results[0]);
      // Ürün bilgilerini otomatik doldur
    } else {
      setProductExists(null);
      // Tam formu göster
    }
  }
  
  return (
    <form onSubmit={handleQuickAdd}>
      {/* Daima göster */}
      <Input 
        label="Ürün Adı / Barkod" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Domates veya barkod okutun..."
      />
      
      {/* Sadece yeni ürün ise göster */}
      {productExists === null && searchTerm.length >= 3 && (
        <>
          <Select label="Kategori" name="categoryId" required />
          <Select label="Birim" name="baseUnitId" required />
          <TextArea label="Ürün Açıklaması" name="productDescription" />
        </>
      )}
      
      {/* Daima göster */}
      <Input label="Miktar" name="quantity" type="number" required />
      <Input label="Birim Fiyat" name="unitPrice" type="number" required />
      <Select label="Tedarikçi" name="supplierId" required />
      <Select label="Depo" name="warehouseId" required />
      <Select label="Stok Tipi" name="stockTypeId" required />
      <DatePicker label="Son Kullanma Tarihi" name="expirationDate" />
      <TextArea label="Batch Notu" name="subInventoryDesc" />
      
      <Button type="submit">
        {productExists ? 'Batch Ekle' : 'Ürün ve Batch Oluştur'}
      </Button>
    </form>
  );
}
```

---

### 3. Stok Durumu Badge Komponenti

```javascript
function StockStatusBadge({ status }) {
  const config = {
    LOW: { color: 'red', icon: '⚠️', text: 'Düşük' },
    NORMAL: { color: 'green', icon: '✅', text: 'Normal' },
    OVERSTOCKED: { color: 'orange', icon: '📦', text: 'Fazla' },
    NO_INVENTORY: { color: 'gray', icon: '❌', text: 'Envanter Yok' }
  };
  
  const { color, icon, text } = config[status];
  
  return (
    <span className={`badge badge-${color}`}>
      {icon} {text}
    </span>
  );
}
```

---

## 🚨 Hata Yönetimi

### Yaygın Hatalar ve Çözümleri

#### 1. Yeni Ürün için Kategori/Birim Eksik
```javascript
// Hata: 400 Bad Request
{
  "message": "categoryId and baseUnitId are required when creating a new product"
}

// Çözüm: Form validasyonu ekle
function validateForm(formData, productExists) {
  if (!productExists) {
    if (!formData.categoryId || !formData.baseUnitId) {
      showError('Yeni ürün için Kategori ve Birim seçimi zorunludur!');
      return false;
    }
  }
  return true;
}
```

#### 2. Duplicate Barcode
```javascript
// NOT: Product modelinde barcode alanı bulunmamaktadır.
// Bu hata artık oluşmayacaktır.
```

#### 3. Insufficient Stock (Çıkarma İşlemi)
```javascript
// Hata: 400 Bad Request
{
  "message": "Insufficient stock. Available: 50, Requested: 100"
}

// Çözüm: Mevcut stok bilgisini göster
showError(
  `Yetersiz stok! Mevcut: ${availableStock}, ` +
  `Talep edilen: ${requestedAmount}`
);
```

---

## ✅ Best Practices

### 1. **Transaction Güvenliği**
- `quick-add` endpoint'i kullanarak atomik işlemler yapın
- Hata durumunda tüm işlem otomatik geri alınır
- Frontend'de manuel rollback işlemine gerek yoktur

### 2. **Arama Optimizasyonu**
```javascript
// ❌ Kötü: Her tuş vuruşunda API çağrısı
onChange={(e) => searchInventory(e.target.value)}

// ✅ İyi: Debounce kullan
const debouncedSearch = useMemo(
  () => debounce((query) => searchInventory(query), 300),
  []
);
onChange={(e) => debouncedSearch(e.target.value)}
```

### 3. **Stok Hesaplama**
```javascript
// ❌ Kötü: Frontend'de hesaplama
const totalStock = inventory.subInventories.reduce(
  (sum, sub) => sum + sub.quantity, 0
);

// ✅ İyi: Backend'den gelen hazır değeri kullan
const totalStock = inventory.totalQuantity;  // Backend hesapladı
```

### 4. **Validasyon**
```javascript
// Frontend validasyonu + Backend validasyonu
const schema = {
  quantity: {
    required: true,
    min: 1,
    type: 'number'
  },
  unitPrice: {
    required: true,
    min: 0.01,
    type: 'number'
  },
  productName: {
    required: true,
    minLength: 1,
    type: 'string'
  }
};
```

### 5. **Loading States**
```javascript
async function quickAddInventory(formData) {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/v1/inventory/quick-add', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }
    
    const data = await response.json();
    showSuccess('Envanter başarıyla eklendi!');
    return data;
    
  } catch (error) {
    setError(error.message);
    showError(error.message);
  } finally {
    setLoading(false);
  }
}
```

### 6. **Gerçek Zamanlı Güncellemeler**
```javascript
// WebSocket ile stok değişikliklerini dinle (opsiyonel)
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3000/inventory-updates');
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    if (update.type === 'STOCK_ADJUSTED') {
      updateLocalInventoryData(update.data);
    }
  };
  
  return () => ws.close();
}, []);
```

---

## 📱 Örnek UI Bileşenleri

### TypeScript Interface'leri
```typescript
interface QuickAddFormData {
  productName: string;
  categoryId?: string;           // UUID
  baseUnitId?: string;           // UUID
  productDescription?: string;
  inventoryDesc?: string;
  quantity: number;
  unitPrice: number;
  supplierId: string;            // UUID
  warehouseId: string;           // UUID
  expirationDate?: string;
  subInventoryDesc?: string;
}

interface SearchResult {
  id: number;
  name: string;
  category: { id: number; name: string };
  baseUnit: { id: number; name: string };
  inventory?: {
    id: string;
    minStockLevel: number;
    maxStockLevel: number;
    subInventories: SubInventory[];
  };
  totalQuantity: number;
  stockStatus: StockStatus;
}
```

---

## 🔗 Diğer Gerekli Endpoint'ler

Bu sistemin çalışması için aşağıdaki yardımcı endpoint'lere ihtiyaç vardır:

1. **Kategoriler:** `GET /api/v1/categories`
2. **Birimler:** `GET /api/v1/base-units`
3. **Tedarikçiler:** `GET /api/v1/suppliers`
4. **Depolar:** `GET /api/v1/warehouses`

Bu endpoint'lerin form dropdown'larında kullanılması gerekir.

**NOT:** Stok tipi bilgisi ürün seviyesinde tutulmaktadır, ayrıca batch seviyesinde stok tipi bulunmamaktadır.

---

## 📞 Destek ve Sorular

Herhangi bir sorunuz veya öneriniz varsa backend ekibi ile iletişime geçin.

**Swagger Dokümantasyonu:** `http://localhost:3000/api`

---

## 🎯 Özet ve Öneriler

### ✅ Önerilen Yaklaşım
- **Quick-Add endpoint'ini kullanın** → Transaction güvenliği
- **Search endpoint'i ile ürün varlığını kontrol edin** → Duplicate prevention
- **Frontend'de akıllı form gösterin** → UX optimization
- **Backend'den gelen hesaplanmış değerleri kullanın** → Consistency

### ❌ Önerilmeyen Yaklaşımlar
- Manuel olarak birden fazla endpoint çağırmak
- Frontend'de transaction benzeri davranış simüle etmek
- Hata durumunda frontend'de rollback yapmaya çalışmak
- Stok miktarlarını frontend'de hesaplamak

---

**Son Güncelleme:** 10 Aralık 2025  
**API Versiyonu:** v1  
**Backend Dokümantasyon:** [SWAGGER_TEST_GUIDE.md](./SWAGGER_TEST_GUIDE.md)
