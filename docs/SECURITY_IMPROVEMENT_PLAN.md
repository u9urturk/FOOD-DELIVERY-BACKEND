Auth süreçleri için gelecek yapılandırmalar 

		Ek pratikler:

				access TTL düşük + refresh TTL daha uzun + aktif rotation = dengeli güvenlik.
				SameSite=None gerekiyorsa (farklı domain) CSRF zorunlu hale gelir.
				Log: Refresh reuse → güvenlik uyarısı.
				İlerisi: Refresh token’a device fingerprint bağlama, KID ile JWT anahtar rotasyonu, CSRF guard tamamlanması.