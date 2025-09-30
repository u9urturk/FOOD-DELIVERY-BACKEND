





<<11-09-2025>>
<<inventer çıktısı.. >>

{
  "success": true,
  "data": [
    {
      "id": "846386d9-c49e-4fce-ba14-84649ea0a3d6",
      "productId": "eb831232-9978-4dc4-9c49-728492437774",
      "warehouseId": "668b2713-0a10-43fe-8761-bb4826f03cf9",
      "supplierId": "a709b5f5-ebe4-48fa-b895-4cca12c43064",
      "currentQuantity": "250",
      "minStockLevel": "50",
      "maxStockLevel": "500",
      "lastCountedAt": "2025-08-01T00:00:00.000Z",
      "lotNumber": "LOT-2025-0001",
      "expirationDate": "2026-01-01T00:00:00.000Z",
      "createdAt": "2025-09-11T15:18:41.222Z",
      "updatedAt": "2025-09-11T15:18:41.222Z",
      "product": {
        "id": "eb831232-9978-4dc4-9c49-728492437774",
        "name": "Sütaş Ayran 200 ml",
        "description": "Ayran",
        "sku": "ST-AYRN-001",
        "barcode": "1234567890129",
        "shelfLifeDays": 60,
        "categoryId": "4bc02040-38ff-478a-9184-856448c95105",
        "stockTypeId": "f889adc6-8cd9-43d2-aa59-5245b9d4612a",
        "baseUnitId": "d0d076de-f259-4113-a00c-9b67189025db"
      },
      "warehouse": {
        "id": "668b2713-0a10-43fe-8761-bb4826f03cf9",
        "name": "TrendRestoran Merkez",
        "location": "Bartın, TR",
        "code": "BR-001",
        "isActive": true,
        "createdAt": "2025-09-11T15:07:11.269Z",
        "updatedAt": "2025-09-11T15:07:11.269Z"
      },
      "supplier": {
        "id": "a709b5f5-ebe4-48fa-b895-4cca12c43064",
        "name": "Sütaş",
        "contactInfo": "Sütaş Örnek adress , ekstra bilgiler ! ! ",
        "phone": "+90 555 555 5555",
        "email": "sütaş@example.com",
        "address": "Istanbul, TR",
        "leadTimeDays": 3,
        "isActive": true,
        "createdAt": "2025-09-11T14:54:14.175Z",
        "updatedAt": "2025-09-11T14:54:14.175Z"
      }
    }
  ],
  "timestamp": "2025-09-11T15:18:48.618Z"
}
















<<Notlar>>
    -- inventer hareketlerinde warehose parametreleri nullalbe olmalı 
    -- inventer hareketlerini bir log olarak takip edeceğimiz için unit ilgili aksiyon sırasında elde edilen string parametre olarak kayıt altına alınacak
    -- sourceEventId ve sourceEvetType parametrelerini anlamlandır !!
    -- aksiyon sahibini userId ile al. bu operasyonları backend kendi yaşam döngüsü içerisinde gerçekleştirecek !! sistemin stabil çalışabilmesi için bu yapılara qq sistemleri entegre et redis ya da kafka kullanılabilir kar/zarar analizi sonrası tervcihini yap.









<<Test
warehouse --- depo -- 668b2713-0a10-43fe-8761-bb4826f03cf9
movementtypes --- satın alma  -- 8ca14347-1cd0-4b94-b053-5b4f2f9573d4
movementtypes --- satış  -- 66c43f67-c6aa-40d5-bb3c-08788db942d6
movementtypes --- recete t.  -- ffb5ef77-b5d6-4b14-bc87-1a8e61754e0a
supplier --- tedarikçi  -- a709b5f5-ebe4-48fa-b895-4cca12c43064
product -- sütaş ayran -- eb831232-9978-4dc4-9c49-728492437774

category -- soğuk içecek -- 4bc02040-38ff-478a-9184-856448c95105
stocktype -- ürün -- f889adc6-8cd9-43d2-aa59-5245b9d4612a
basunit -- adet -- d0d076de-f259-4113-a00c-9b67189025db
>>





