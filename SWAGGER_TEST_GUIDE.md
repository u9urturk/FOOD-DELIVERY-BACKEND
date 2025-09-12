# 🧪 Backend Güvenlik Akışı Test Rehberi

Bu rehber, frontend'e geçmeden önce backend'deki tam güvenlik akışını Swagger ile test etmek için hazırlanmıştır.

## 🎯 Test Amacı
Frontend'den gelen istekleri simüle ederek:
- CSRF korumasının çalıştığından emin olmak
- Cookie-based authentication'ın doğru çalıştığından emin olmak
- Token rotation'ın sorunsuz işlediğinden emin olmak

## 📋 Test Adımları

### 1. 🔓 CSRF Token Alma
**Endpoint:** `GET /api/v1/auth/csrf`

1. Swagger'da bu endpoint'i çağırın
2. Response'dan `csrfToken` değerini kopyalayın
3. Cookie'nin otomatik olarak set edildiğini kontrol edin

**Beklenen Response:**
```json
{
  "success": true,
  "csrfToken": "a1b2c3d4e5f6789abcdef..."
}
```

### 2. 🔐 Login İşlemi (CSRF Korumalı)
**Endpoint:** `POST /api/v1/auth/login`

#### Adım 2.1: Header Ekleme
1. Swagger'da login endpoint'ini açın
2. "Parameters" bölümünde "Add Header" butonuna tıklayın
3. Header Name: `X-CSRF-Token`
4. Header Value: (1. adımda aldığınız token)

#### Adım 2.2: Request Body
```json
{
  "usernameOrEmail": "test@example.com",
  "otpCode": "123456"
}
```

#### Adım 2.3: Test Senaryoları

**Test 2.3.1: CSRF Token Olmadan**
- Header eklemeden istek gönderin
- Beklenen: `403 Forbidden - X-CSRF-Token header'ı eksik`

**Test 2.3.2: Yanlış CSRF Token**
- Yanlış token ile istek gönderin  
- Beklenen: `403 Forbidden - CSRF token eşleşmiyor`

**Test 2.3.3: Doğru CSRF Token**
- Doğru token ile istek gönderin
- Beklenen: Login işlemi başarılı (kullanıcı varsa)

### 3. 🔄 Token Refresh Testi
**Endpoint:** `POST /api/v1/auth/refresh`

1. Login'den sonra yeni CSRF token alın
2. Refresh endpoint'inde CSRF header'ı ekleyin
3. İsteği gönderin

**Beklenen:** Yeni access token ve rotated refresh token

### 4. 👤 Profile Testi (JWT Korumalı)
**Endpoint:** `POST /api/v1/auth/profile`

1. CSRF token gerekmez (sadece JWT)
2. Cookie'deki access token ile istek gönderin

**Beklenen:** Kullanıcı profil bilgileri

### 5. 🚪 Logout Testi
**Endpoint:** `POST /api/v1/auth/logout`

1. Yeni CSRF token alın
2. CSRF header'ı ekleyin
3. Logout isteği gönderin

**Beklenen:** Tüm cookie'ler temizlenir

## ✅ Başarı Kriterleri

### CSRF Koruması
- [ ] CSRF token olmadan korumalı endpoint'ler erişilemez
- [ ] Yanlış CSRF token ile istekler reddedilir
- [ ] Doğru CSRF token ile istekler başarılı

### Cookie Yönetimi  
- [ ] Login sonrası access_token cookie'si set edilir
- [ ] Login sonrası refresh_token cookie'si set edilir
- [ ] Logout sonrası tüm cookie'ler temizlenir

### Token Security
- [ ] Access token kısa ömürlü (15 dakika)
- [ ] Refresh token rotation çalışıyor
- [ ] JWT payload'unda güvenlik bilgileri mevcut

### CORS Güvenliği
- [ ] Sadece izin verilen origin'lerden istekler kabul edilir
- [ ] Self-origin (Swagger) istekleri kabul edilir
- [ ] Cross-origin isteklerde credential'lar gönderilir

## 🐛 Sorun Giderme

### "CSRF token eksik" Hatası
- CSRF endpoint'ini önce çağırdığınızdan emin olun
- Browser'da cookie'nin set edildiğini kontrol edin

### "CSRF token eşleşmiyor" Hatası  
- Header'daki token'ın response'dakiyle aynı olduğunu kontrol edin
- Token'ı kopyalarken ekstra boşluk olmadığından emin olun

### "CORS policy violation" Hatası
- Railway deployment'ında self-origin kontrolünü kontrol edin
- Debug endpoint'ini kullanarak origin bilgilerini kontrol edin

## 🔧 Debug Endpoint'leri

### CORS Debug
`GET /debug/cors` - CORS konfigürasyon bilgileri

### Health Check
`GET /health` - Uygulama durumu

## 📝 Test Raporu Şablonu

```
✅ CSRF Token Alma: Başarılı
✅ CSRF Koruması: Çalışıyor  
✅ Login İşlemi: Başarılı
✅ Cookie Yönetimi: Çalışıyor
✅ Token Refresh: Başarılı
✅ Profile Erişimi: Başarılı
✅ Logout İşlemi: Başarılı

🎉 Backend güvenlik akışı tamamen çalışıyor!
```

## 🚀 Sonraki Adımlar

Tüm testler başarılı olduktan sonra:
1. Environment variable'ları ile CSRF bypass eklenecek
2. Frontend integration'a geçilebilecek
3. Production deployment için final güvenlik kontrolleri yapılacak

Bu testleri tamamladıktan sonra backend'inizin frontend isteklerini tam güvenlik ile karşılayabileceğinden emin olabilirsiniz.
