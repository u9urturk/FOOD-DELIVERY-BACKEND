# Zone.md Uygun Güvenlik İyileştirmeleri

Bu güncellemeler, `Zone.md` dokümanındaki güvenlik önerilerine uygun olarak gerçekleştirilmiştir.

## Yapılan Ana Değişiklikler

### 1. CSRF Koruması İyileştirmeleri

- **Double Submit Cookie Pattern**: CSRF token'ı hem cookie hem de response body'de gönderilir
- **Token Doğrulama**: CSRF service ile token validasyonu ve süre kontrolü
- **Güçlü Token Üretimi**: 32 byte rastgele token üretimi
- **Token Rotation**: Kullanılmış token'ların iptali

### 2. Cookie Güvenliği

- **HttpOnly**: XSS saldırılarına karşı koruma
- **Secure**: HTTPS zorunluluğu (production ve cross-site durumlarında)
- **SameSite=Strict**: CSRF saldırılarına karşı güçlü koruma
- **Kısa Ömürlü Access Token**: Varsayılan 15 dakika (Zone.md önerisi)

### 3. Token Yönetimi

- **JWT ID (jti)**: Token rotation için benzersiz kimlik
- **Issuer/Audience**: Token doğrulama için ek güvenlik
- **Kısa Ömrü**: Access token 15 dakika, refresh token 7 gün

### 4. CORS Güvenliği

- **Strict Origin Control**: Production'da sadece belirlenen origin'lere izin
- **Güvenli Headers**: X-CSRF-Token ve diğer güvenlik header'ları
- **Credentials Support**: HttpOnly cookie'ler için

### 5. Helmet Güvenliği

- **Content Security Policy**: XSS saldırılarına karşı ek koruma
- **HSTS**: HTTPS zorunluluğu
- **Güvenli Varsayılanlar**: Minimal attack surface

## Kullanım

### Environment Ayarları

`.env.example` dosyasından kopyalayın:

```bash
cp .env.example .env
```

### Önemli Ayarlar

```env
# Kısa ömürlü access token (Zone.md önerisi)
ACCESS_TOKEN_TTL="900s"  # 15 dakika

# Cross-site cookie ayarları
CROSS_SITE_COOKIES=false  # Aynı domain için
COOKIE_DOMAIN=localhost   # Development için

# Production için:
# CROSS_SITE_COOKIES=true
# COOKIE_DOMAIN=.yourdomain.com
```

### Frontend Entegrasyonu

CSRF token kullanımı:

```typescript
// 1. CSRF token al
const response = await fetch('/api/v1/auth/csrf', { credentials: 'include' });
const { csrfToken } = await response.json();

// 2. API çağrılarında header olarak gönder
const apiResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify(loginData)
});
```

## Güvenlik Avantajları

### XSS Koruması
- HttpOnly cookie'ler ile token'lara JavaScript erişimi engellendi
- CSP ile script injection sınırlandırıldı

### CSRF Koruması
- SameSite=Strict ile otomatik koruma
- Double Submit Cookie Pattern ile ek güvenlik
- Token rotation ile replay attack önleme

### Session Hijacking Koruması
- Kısa ömürlü access token'lar
- Secure cookie'ler ile MITM koruması
- JWT ID ile token tracking

### Brute Force Koruması
- Rate limiting (mevcut)
- Account lockout (AuthService'de uygulanmalı)
- IP-based blocking (mevcut)

## Deployment Notları

### Production Ayarları

```env
NODE_ENV=production
CROSS_SITE_COOKIES=true  # Farklı subdomain'ler için
ACCESS_TOKEN_TTL="300s"  # Daha da kısa (5 dakika)
```

### Load Balancer Ayarları

Sticky session'lar gerekli değil (stateless JWT).

### CDN/Proxy Ayarları

Cookie forwarding'i etkinleştirin:
- `Set-Cookie` header'ları
- `Cookie` header'ları
- CORS header'ları

## Monitoring

### Güvenlik Metrikleri

- CSRF token başarısızlık oranları
- Token refresh oranları  
- Failed login attempts
- Unusual session patterns

### Loglanacak Olaylar

- CSRF validation failures
- Token expiry events
- Cross-origin requests
- Security header violations

## Gelecek İyileştirmeler

1. **Redis Integration**: CSRF token'ları Redis'te saklama
2. **Device Tracking**: Session'ları cihaz bazında izleme
3. **Anomaly Detection**: Olağandışı kullanım pattern'leri
4. **2FA Integration**: İki faktörlü doğrulama
5. **Session Analytics**: Detaylı session analizi

Bu iyileştirmeler, Zone.md dokümanındaki modern web güvenliği standartlarına tam uyum sağlamaktadır.
