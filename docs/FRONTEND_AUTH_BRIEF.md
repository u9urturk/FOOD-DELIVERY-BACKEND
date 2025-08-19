# FRONTEND AUTH BRIEF (Cookie-Only Mimari)

Versiyon: 1.0  
Tarih: 2025-08-18  
Durum: Stabil backend uygulanmış; bu doküman frontend entegrasyonu için net talimat verir.

---
## 1. Mimari Özet
- Kimlik doğrulama tamamen HttpOnly cookie üzerinden çalışır. `Authorization` header **KULLANILMAZ**.
- İki hassas cookie: `access_token` (kısa ömür ~10 dk) ve `refresh_token` (sabit oturum ömrü ~7 gün).  
- Access token süresi dolunca frontend otomatik / sessiz `POST /auth/refresh` çağırır; başarılıysa yeni `access_token` + (gerekirse) `refresh_token` alır.  
- Refresh token rotasyonu: Her geçerli refresh kullanımında yeni değer üretilir; eski değer iptal edilir (reuse saldırısı tespiti yapılır).  
- CSRF koruması (yalnızca cross-site dağıtım senaryosu): `GET /auth/csrf` ile alınan token `csrf_token` adlı (HttpOnly olmayan) cookie + JSON body alanı döner. State-changing isteklerde header: `X-CSRF-Token`.  
- Sunucu, cookie’leri `SameSite=Strict` (aynı origin) veya `SameSite=None; Secure` (CROSS_SITE_COOKIES=true ise) şeklinde gönderir.

## 2. Kullanılan Endpointler
| Endpoint | Method | Auth Gerekli? | Amaç | Body | Response (Önemli alanlar) |
|----------|--------|--------------|------|------|---------------------------|
| /auth/register | POST | Hayır | Yeni kullanıcı | { username, password, otp? } | { success, user: (maskele veya basit), message }
| /auth/login | POST | Hayır | OTP doğrulayıp oturum aç | { username, otp } | { success, session_id, user_summary, refresh_expires_at }
| /auth/login-recovery | POST | Hayır | Recovery kodu ile login | { username, recoveryCode } | Benzer login dönüşü |
| /auth/profile | POST | Evet (access cookie) | Mevcut kullanıcı profili | - | { userId, username, roles, ... } |
| /auth/refresh | POST | refresh cookie | Access yenile (ve refresh rotasyonu) | - | { success, session_id, refresh_expires_at } |
| /auth/logout | POST | Evet | Geçerli oturumu sonlandır | - | { success, message }
| /auth/csrf | GET | (Opsiyonel) | CSRF token al | - | { csrfToken } + cookie `csrf_token` |
| /profile/me/sessions | GET | Evet | Aktif / geçmiş (revoked/expired hariç) oturumları listele | - | SessionDeviceResponse[] |
| /profile/me/sessions/:id | DELETE | Evet | Belirli oturumu sonlandır | - | { message }
| /profile/me/sessions?keepCurrent=true | DELETE | Evet | Toplu sonlandır (mevcut hariç) | - | { message }

Not: Login / refresh response body’si token içermez; tokenler sadece cookie’de.

## 3. Cookie Detayları
| Ad | HttpOnly | SameSite | Tahmini TTL | Yenilenme | İçerik |
|----|----------|----------|-------------|-----------|--------|
| access_token | Evet | Strict veya None | ~10 dakika | Her login + her refresh | JWT (userId, username, roles, sessionId) |
| refresh_token | Evet | Strict veya None | ~7 gün (sabit) | Her refresh’te yenisi | `<sessionId>.<random>` format (ham) |
| csrf_token | Hayır | Strict veya None | 1 saat | Manuel GET /auth/csrf | Rastgele string |

Önemli: Refresh rotasyonu oturum süresini UZATMAZ. 7 gün sabittir.

## 4. Yaşam Döngüsü Akışları
### 4.1 İlk Uygulama Açılışı
1. (Opsiyonel) `GET /auth/csrf` (cross-site ise).  
2. `POST /auth/profile` dene:  
   - 200 → kullanıcı oturumda.  
   - 401 → `POST /auth/refresh` dene. Başarılı → tekrar profile; başarısız → login ekranını göster.

### 4.2 Login Akışı
1. Kullanıcı OTP girer → `POST /auth/login`.  
2. 200 → Sunucu iki cookie set eder: `access_token`, `refresh_token`. Body’de token yok.  
3. Ardından UI state güncellenir (kullanıcı bilgisi response’tan alınabilir).  

### 4.3 Korunan İstek Gönderme
- Sadece fetch/axios çağır; ekstra header’da Authorization verme.  
- Eğer CROSS_SITE_COOKIES=true ise: her state-changing istekte `X-CSRF-Token: <csrf_token cookie veya saklanan değer>` ekle.  

### 4.4 Access Token Expire Durumu
- Korunan endpoint 401 dönerse:  
  a. Bir kere otomatik `POST /auth/refresh` dene.  
  b. Refresh 200 → orijinal isteği yeniden gönder.  
  c. Refresh 401 / 403 → Kullanıcıyı logout state’ine al ve login sayfası.  
- Sonsuz döngü engelle: 1 istek içinde max 1 refresh denemesi.

### 4.5 Logout
- `POST /auth/logout` → Backend cookie’leri temizler.  
- Ekstra: Frontend, bellek içi user state’i sıfırlar.  

### 4.6 Session Süresi Dolması (7 Gün)
- Access refresh çalışmaz (refresh 401).  
- Kullanıcı login’e yönlendirilir (yeni OTP / recovery süreci).  

## 5. Hata ve Edge Case Yönetimi
| Durum | Sebep | Frontend Davranışı |
|-------|-------|--------------------|
| 401 korunan endpoint | Access token eksik/expired | 1 kez refresh dene → tekrar çağır |
| 401 refresh | Refresh token geçersiz / reuse / oturum bitmiş | Zorunlu logout → login ekranı |
| 429 login | Rate limit | Kullanıcıya bekleme mesajı göster |
| 401 login | OTP/recovery yanlış | Form hata mesajı |
| Ağ hatası | Geçici connectivity | Exponential backoff (ör: 0.5s,1s,2s) max 3 tekrar |

## 6. Frontend Uygulama Katmanları (Öneri)
1. authClient (API wrapper)  
2. sessionManager (state + refresh logic)  
3. csrfManager (cross-site modunda)  
4. interceptor / fetch wrapper (401 handle + retry)  

## 7. Örnek Pseudo Kod
```ts
// fetchWrapper.ts
async function apiFetch(input: RequestInfo, init: RequestInit & { retry?: boolean } = {}) {
  const resp = await fetch(input, { ...init, credentials: 'include' });
  if (resp.status !== 401) return resp;
  // 401 ise ve daha önce denemediysek refresh dene
  if (init.retry) return resp; // ikinci kez 401 ise bırak
  const refreshOk = await refreshSession();
  if (!refreshOk) return resp; // login yönlendirme dışarıda
  return apiFetch(input, { ...init, retry: true });
}

async function refreshSession() {
  const r = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
  return r.ok;
}
```

CSRF Header ekleme (cross-site):
```ts
function withCsrf(init: RequestInit = {}): RequestInit {
  const token = readCookie('csrf_token');
  if (token) {
    init.headers = { ...(init.headers||{}), 'X-CSRF-Token': token };
  }
  return init;
}
```

## 8. Güvenlik Yapılmaması Gerekenler
- HttpOnly cookie’leri JS ile okumaya çalışmak. (Mümkün değil)  
- Refresh token’ı localStorage / memory’e kopyalamak.  
- Access token süresi dolmadan gereksiz /auth/refresh spam’i (sunucu log gürültüsü).  
- 401 sonrası sonsuz refresh döngüsü.  
- Cross-site modunda CSRF header’ını atlamayı unutmak.  

## 9. İzleme & Observability
- Eğer UI’da global error interceptor varsa refresh fallback mantığını burada konumlandır.  
- Tekrar eden başarısız refresh (ör: >2) için kullanıcıya “Oturumun süresi doldu. Yeniden giriş yap.” mesajı.

## 10. Konfigürasyona Duyarlı Noktalar
| Değişken | Etki |
|----------|------|
| CROSS_SITE_COOKIES=true | SameSite=None; Secure; CSRF zorunlu | 
| ACCESS_TOKEN_TTL | Access cookie süresi (frontend mantığı değişmez, sadece 401 frekansı) |
| REFRESH_TOKEN_TTL_DAYS | Toplam oturum süresi | 

## 11. QA Checklist (Frontend)
- [ ] Login → profile çağrısı 200
- [ ] Access süresi bitince otomatik refresh + orijinal istek yeniden çalışır
- [ ] Refresh sonrası eski refresh token ile yeniden kullanım 401 (backend reuse detection) → UI logout
- [ ] Logout sonrası profile 401 ve refresh denemesi başarısız
- [ ] CROSS_SITE_COOKIES senaryosunda CSRF header yoksa state-changing endpoint 403 (guard eklenince test edilecek)
- [ ] Session list endpoint: isCurrent=true olan satır tam olarak aktif oturumu gösteriyor
- [ ] Session revoke sonrası list tekrar yüklendiğinde ilgili oturum status=revoked

## 12. Gelecek Geliştirmeler (Backend bekleyen)
- CSRF Guard (şu an sadece token verme var)  
- JWT key rotation (KID header)  
- Aktif cihaz listesi UI’si (session list endpoint)  

## 13. Oturum (Session) Liste Alanları
`GET /profile/me/sessions` dönüşü her eleman için:

| Alan | Açıklama | Örnek |
|------|----------|-------|
| id | Session ID (backend DB primary key) | `sess_abc123` |
| createdAt | Oturum açılış zamanı | `2025-08-18T09:15:00Z` |
| expiresAt | Oturumun sabit bitiş zamanı (refresh ile uzamaz) | `2025-08-25T09:15:00Z` |
| ip | İlk açılış IP bilgisi | `192.168.1.10` |
| userAgent | Raw user-agent string | `Mozilla/5.0 ...` |
| browser | UA parse sonucu tarayıcı adı | `Chrome` |
| os | İşletim sistemi | `Windows` |
| device | Cihaz / model / tip kombinasyonu | `Desktop` veya `Apple iPhone Mobile` |
| isCurrent | Bu satır mevcut tarayıcı oturumu mu? | true/false |
| status | `active` / `revoked` / `expired` | `active` |
| revokedAt | (Varsa) iptal zamanı | `2025-08-19T10:10:00Z` |
| revokedReason | (Varsa) iptal sebebi (`manual`,`bulk`,`rotated`, vb.) | `manual` |

Frontend temsil önerisi:
- Aktif (isCurrent=true) satırını rozetle vurgula ("Bu cihaz").
- status=revoked için soluk / strike veya etkileşimsiz hale getir.
- Expired oturumlar istersen filtrelenebilir (backend şu an sadece active gösteriyor; UI gerekirse arşiv view ekleyebilir).

Revoke UX akışı:
1. Kullanıcı bir satırda "Oturumu Sonlandır" seçer → DELETE /profile/me/sessions/:id.
2. Başarılı yanıt sonrası listeyi yeniden fetch et.
3. Eğer current oturum sonlandırıldıysa backend access token 401 üretir; kullanıcıya "Bu oturum sonlandırıldı" mesajı + login yönlendirme göster.

---
Bu brief frontend ekibinin geliştirmeye başlaması için yeterlidir. Sorular için backend ile senkron olun.
