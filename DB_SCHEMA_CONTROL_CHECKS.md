# Veritabanı Şema Kontrol & Doğrulama Rehberi

Odak: Yeni UNIQUE constraint / index eklemeleri, şema migration'ları öncesi risk azaltma adımları. Örnek vaka: `users.email` alanına UNIQUE eklenmesi.

---
## 1. Amaç
Şema değişiklikleri (özellikle UNIQUE, NOT NULL, FOREIGN KEY, CHECK) eklenmeden önce canlı / geliştirici verisinin uyumluluğunu doğrulamak, migration başarısızlıklarını ve servis kesintilerini önlemek.

---
## 2. Hızlı Checklist (Pre-Migration)
| Adım | Açıklama | Durum |
|------|----------|-------|
| 1 | Planlanan constraint / index listesi çıkarıldı mı? |  |
| 2 | İlgili sütun(lar) için duplicate / invalid veri tarandı mı? |  |
| 3 | Gerekirse düzeltme (update / nullify / silme) script'i hazırlandı mı? |  |
| 4 | Migration dry-run (staging) yapıldı mı? |  |
| 5 | Backup / snapshot planı doğrulandı mı? |  |
| 6 | Rollback stratejisi belirlendi mi? |  |
| 7 | Uygulama kodu yeni constraint'e hazır mı? |  |
| 8 | İzleme / log alarmı güncellendi mi? |  |

---
## 3. UNIQUE Constraint Ön Kontrolleri
Örnek: `users.email` alanına UNIQUE ekleniyor (nullable). Postgres'te `NULL` değerler benzersiz kabul edilir; yani birden fazla `NULL` sorun oluşturmaz.

### 3.1 Duplicate Tespiti (Genel)
```sql
SELECT email, COUNT(*)
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
```
Dönen satır sayısı = 0 olmalı.

### 3.2 CASE Duyarlılığı
Varsayılan `text` karşılaştırması case-sensitive'dir. Case-insensitive benzersizlik istiyorsak:
1. `citext` extension: 
```sql
CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE users ALTER COLUMN email TYPE citext;
```
2. Veya lower bazlı partial index:
```sql
CREATE UNIQUE INDEX CONCURRENTLY ux_users_email_lower
  ON users (LOWER(email))
  WHERE email IS NOT NULL;
```
> Not: Prisma `@unique` doğrudan expression index tanımlamaz; bu tür indexler manuel SQL migration ile eklenir.

### 3.3 Temizlik Stratejileri
Duplicate bulunduysa örnek çözümler:
- En güncel kaydı tut, eski kayıtların `email` alanını `NULL` yap:
```sql
WITH dups AS (
  SELECT id, email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) AS rn
  FROM users
  WHERE email IS NOT NULL
)
UPDATE users u
SET email = NULL
FROM dups d
WHERE u.id = d.id AND d.rn > 1;
```
- Veya email'e otomatik suffix ekle (geçici):
```sql
WITH dups AS (
  SELECT id, email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) AS rn
  FROM users
  WHERE email IS NOT NULL
)
UPDATE users u
SET email = CONCAT(email, '+dup', rn)
FROM dups d
WHERE u.id = d.id AND d.rn > 1;
```

---
## 4. Migration Yaklaşım Karşılaştırması
| Yöntem | Kullanım | Artı | Eksi |
|--------|----------|------|------|
| `prisma migrate dev/deploy` | Versiyonlu migration | İzlenebilir, geri alınabilir | Prod dışı uygunsuz kullanımda data kaybı riski (reset) |
| `prisma db push` | Geliştirme hızlı senkron | Hızlı | Versiyon geçmişi yok; prod için önerilmez |
| Manuel SQL (custom) | Edge vakalar / expression index | Esneklik | Ek bakım yükü |

> Production için: Sadece migration dosyaları + `prisma migrate deploy` önerilir.

---
## 5. Güvenli Rollout Adımları (Önerilen)
1. Staging verisinde duplicate taraması.
2. Temizlik script'ini staging'de doğrula.
3. Migration dosyasını oluştur (`npx prisma migrate dev --name users_email_unique`).
4. Migration SQL incelemesi (peer review / code review).
5. Production öncesi veriyi tekrar tarama (24 saat kala ve son deploy anında).
6. İşletim zamanı izleme: 
   - Migration süresi > beklenen → uyarı.
   - Deadlock / lock wait log kontrolü.
7. Başarılı sonrası: Quick smoke test (register / update email senaryosu).

---
## 6. Risk & Mitigasyon
| Risk | Senaryo | Mitigasyon |
|------|---------|------------|
| Duplicate engeli | Beklenmeyen eski veri | Ön tarama + otomatik temizleyici script |
| Uzun tablo kilidi | Büyük tablo + yoğun yazma | Gece/yoğun olmayan saat, index CONCURRENTLY (manuel) |
| Case varyant çakışması | `Test@x` vs `test@x` | CITEXT / lower index stratejisi |
| Yanlışlıkla prod'da `db push` | Versiyon kaybı | CI guard: prod ortamında `db push` engeli |

---
## 7. İzleme / Alarm Önerileri
- Metric: `migration_apply_seconds` (histogram)
- Log pattern: "Prisma migration applied" → alert on absence
- Error grep: `%duplicate key value violates unique constraint%`

---
## 8. Otomasyon Fikri
Pre-migration hook (CI pipeline):
1. Read-only bağlantıyla duplicate sorgularını çalıştır.
2. Sonuç != 0 → pipeline fail.
3. Otomatik rapor `artifacts/migration_precheck.json` olarak eklenir.

Pseudo komut:
```bash
psql "$DATABASE_URL" -c "COPY (SELECT email, COUNT(*) FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*)>1) TO STDOUT WITH CSV" > duplicates.csv
if [ -s duplicates.csv ]; then echo 'Duplicate emails found'; exit 1; fi
```

---
## 9. Post-Deployment Doğrulama
```sql
-- Constraint var mı?
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'users' AND c.contype = 'u';

-- Null dışı benzersizlik korunuyor mu?
SELECT COUNT(*) FROM (
  SELECT email FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*)>1
) t; -- Sonuç 0 olmalı
```

---
## 10. Gelecek İçin Notlar
- Email alanı için ileride case-insensitive doğrulama istenirse CITEXT dönüşümü migration planına eklenecek.
- Email change flow (pendingEmail + token) devreye alındığında duplicate riskini minimize edecek: final swap transaction ile yapılacak.
- Çok tenant'lı yapıya geçilirse benzersizlik tenant scope’a indirgenecek (unique partial index: `(tenant_id, email)`)

---
## 11. Örnek Jira Görev Şablonu
```
Title: Add UNIQUE constraint on users.email
Description: Ensure no duplicates, create migration, deploy safely.
Acceptance:
 - Duplicate precheck returns 0
 - Migration applied on staging & prod
 - Post-validation queries pass
Risk: Low/Medium
Rollback: Drop constraint (ALTER TABLE users DROP CONSTRAINT users_email_key)
```

---
## 12. Durum (Bu Proje)
- [x] Duplicate risk analizi sözlü doğrulandı (kullanıcı beyanı)
- [ ] Opsiyonel SQL duplicate precheck çalıştırıldı
- [ ] Migration deploy sonrası post-validation sorguları yürütüldü

---
Bu dosya şema değişiklikleri öncesi kullanılacak standart kontrol rehberi olarak güncellenebilir.
