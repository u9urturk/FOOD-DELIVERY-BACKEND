# FRONTEND REALTIME LOGOUT BRIEF

Versiyon: 1.0  
Tarih: 2025-08-18  
Kapsam: WebSocket tabanlı anlık oturum (session) iptali bildirimleri

---
## 1. Amaç
Kullanıcı başka bir cihazdan (veya kendisi) bir oturumu sonlandırdığında, ilgili tarayıcı sekmelerinin kullanıcı aksiyonu beklemeden otomatik logout olması. Böylece:
- İptal edilmiş oturum yetkisiz API çağrıları yapmadan hızlıca kapanır.
- Kullanıcıya anlamlı bir mesaj gösterilir ("Oturum sonlandırıldı").
- Güvenlik ve UX iyileşir (stale session kalmaz).

## 2. Altyapı Özeti (Backend)
- WebSocket endpoint: `wss://<api_host>/ws` (path `/ws`)
- Kimlik doğrulama: Handshake sırasında **HttpOnly** `access_token` cookie okunur ve JWT verify yapılır.
- Her socket meta: `{ userId, sessionId }`.
- Sunucu memory’de map tutar: `sessionId -> sockets`, `userId -> sockets`.
- `DELETE /profile/me/sessions/:id` veya `DELETE /profile/me/sessions` (bulk) çağrıları sonrası ilgili socket’lere event gönderilir.

## 3. Event Tipleri
| Event | Payload Örneği | Açıklama | Frontend Aksiyon |
|-------|----------------|----------|------------------|
| `session_revoked` | `{ type:"session_revoked", sessionId:"sess_123", reason:"manual" }` | Belirli bir session artık geçersiz | Eğer current session ise logout flow başlat |
| `auth_error` | `{ type:"auth_error", message:"Unauthorized" }` | Handshake doğrulaması başarısız | Socket kapat; fallback olarak login sayfası |

(Bulk revoke durumunda sunucu her etkilenen session için ayrı `session_revoked` yayınlar.)

## 4. Frontend Bağlantı Kurulumu
### 4.1 Socket.io Kullanımı (Önerilen)
```ts
import { io, Socket } from 'socket.io-client';

let ws: Socket | null = null;

export function connectRealtime() {
  if (ws) return ws;
  ws = io(API_BASE_URL, {
    path: '/ws',
    withCredentials: true, // cookie gönderimi için
    transports: ['websocket'], // hızlı upgrade
  });

  ws.on('connect', () => {
    console.log('[RT] connected', ws?.id);
  });

  ws.on('session_revoked', (p: { sessionId: string; reason: string }) => {
    if (p.sessionId === getCurrentSessionId()) {
      forceLogout({ reason: p.reason, source: 'realtime' });
    } else {
      // Opsiyonel: Oturum listesi view açık ise invalidate cache
      markSessionStale(p.sessionId);
    }
  });

  ws.on('auth_error', () => {
    // Access token handshake aşamasında geçersiz veya expired.
    scheduleReconnect(); // refresh deneyebilir ya da direkt login yönlendirebilir.
  });

  ws.on('disconnect', (reason) => {
    console.warn('[RT] disconnected', reason);
    if (shouldAutoReconnect(reason)) scheduleReconnect();
  });

  return ws;
}
```

### 4.2 Reconnect Stratejisi
- Exponential backoff: 1s, 2s, 5s, 10s (max 30s).
- Eğer ardışık 2 kez `auth_error` → Access token yenile (silent refresh) dene; başarısızsa login.

## 5. Logout Flow Entegrasyonu
Current session REALTIME event ile revok edilirse:
1. Local user state temizle (store / context / cache).
2. Eğer aktif istekler varsa abort (fetch cancel vb.).
3. Kullanıcıya toast/modal: "Oturum sonlandırıldı (Sebep: manual)."
4. Login ekranına yönlendir.

## 6. Session List UI Senkronizasyonu
- `session_revoked` geldiğinde eğer list view mount ise satırı anında `status=revoked` olarak işaretle.
- Eğer current session revoke ise list view yerine otomatik logout çalışacağı için ayrı bir işlem gerekmez.

## 7. Edge Durumlar
| Durum | Beklenen Davranış |
|-------|-------------------|
| Socket bağlanamıyor | Sessiz retry (backoff) + UI’da minimal "Bağlantı kurulamadı" göstergesi (opsiyonel) |
| `auth_error` anında | Refresh token varsa /auth/refresh → tekrar bağlan; yoksa logout |
| Bulk revoke (mevcut hariç) | Sadece list view güncellenir; current session kalır |
| Kullanıcı manuel logout | Önce HTTP logout → ardından socket.disconnect() çağır |

## 8. Güvenlik Notları
- WS bağlantısı yalnızca access_token geçerliyken açılır; token kısa ömürlü olduğundan uzun süre açık WS ‘zombi’ kalmaz.
- Access token expire olup session geçerliyse HTTP 401 alındığında normal refresh flow → yeni access token → socket yeniden bağlan.
- Sunucu reuse / invalid prefix tespitinde zaten session revoke edip event yayınlar.

## 9. Önerilen Yardımcı Fonksiyonlar
```ts
function getCurrentSessionId(): string | undefined {
  return localStorage.getItem('session_id'); // login sonrası kaydettiğin değer
}

function forceLogout(info: { reason?: string; source?: string }) {
  clearAppState();
  redirectToLogin(info.reason);
}

function shouldAutoReconnect(reason: string) {
  return !['io server disconnect', 'io client disconnect'].includes(reason);
}

let reconnectTimer: any;
let attempt = 0;
function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  attempt++;
  const delay = Math.min([1000, 2000, 5000, 10000, 30000][attempt - 1] || 30000, 30000);
  reconnectTimer = setTimeout(() => {
    connectRealtime();
  }, delay);
}
```

## 10. QA Checklist
- [ ] İki farklı tarayıcıda aynı kullanıcı ile login → A tarayıcıdan B oturumunu revoke → B anında logout.
- [ ] Bulk revoke (keepCurrent=true) → Diğer oturumlar logout, current kalıyor.
- [ ] Bulk revoke (keepCurrent parametresi olmadan) → Tüm oturumlar logout (current dahil). UI hemen login ekranı.
- [ ] Revoke sonrası session list view otomatik güncelleniyor.
- [ ] Access token süresi dolup refresh sonrası websocket yeniden bağlanıyor.
- [ ] `auth_error` senaryosunda otomatik reconnect + refresh deneniyor.

## 11. Gelecek İyileştirmeler
| Başlık | Açıklama |
|--------|----------|
| Heartbeat | Her 60s token tekrar doğrulama, zombi connection kapanışı |
| Bulk Event Optimize | Bir paket: `sessions_bulk_revoked` ile tek mesaj |
| Redis Pub/Sub | Çoklu instance ölçeğinde event yayılımı |
| Reason i18n | revocation reason key → frontend çeviri tablosu |

## 12. Özet
Bu mekanizma ile session revoke işlemi milisaniyeler içinde kullanıcı arayüzüne yansır ve güvenli bir logout deneyimi sağlanır. Yukarıdaki entegrasyon adımları uygulandıktan sonra ek cihaz yönetimi UI’si sorunsuz çalışacaktır.
