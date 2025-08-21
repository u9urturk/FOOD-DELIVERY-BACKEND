İsteğe bağlı sonraki adımlar:
    REALTİME SESSİON YÖNETİMİ TODO 
    Heartbeat / access_token revalidate
    Bulk event’i tek paket (sessions_bulk_revoked) haline getirme
    Redis Pub/Sub (yatay ölçek)




YAPILABİLECEK GELİŞTİRMELER BACKEND --- REALTİME SERVİSE ÜZERİNE

        GATEWAY ŞUAN İÇİN DÜZGÜN GÖRÜNÜYOR SADECE KOD YAPISIN İNCELE VE REFACTÖR EDİLEBİLİR Mİ TESPİT ET. SOLİD PRENSİPLERİ VE CLEANCODE ÜZERİNE NE GİBİ GÜNCELLEŞTİRMELER YAPILABİLİR ??? 

        SESSİON-EVENTLERİNİ İNCELE BURADA DA CLEANCODE VE SOLİD PRENSİPLERİ ÜZERİNE NE GİBİ GELİŞTŞİRMELER YAPILABİLİR İNCELE.




21.08.2025

        BU KODDA TOKEN DOĞRULAMA MANTIĞI EKLENECEK, ÖNCELİKLE KULLANILACAK YAPI VE TEKNOLOJİ NETLEŞTİRİLECEK AVANTAJ VE DEZAVANTAJLARI AÇISINDAN DEĞERLENDİRİLECEK.

        import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

            @Injectable()
            export class CsrfGuard implements CanActivate {
            canActivate(context: ExecutionContext): boolean {
                const request = context.switchToHttp().getRequest();
                const csrfCookie = request.cookies?.csrf_token;
                const csrfHeader = request.headers['x-csrf-token'];

                // HttpOnly cookie olduğundan, frontend header gönderemez. Sadece cookie kontrolü yapılır.
                if (!csrfCookie) {
                throw new ForbiddenException('CSRF token eksik');
                }

                // İsteğe bağlı: Token doğrulama mantığı eklenebilir (örneğin, Redis ile eşleşme, expiry vs.)
                // Şimdilik sadece varlığını kontrol ediyoruz.
                return true;
            }
            }