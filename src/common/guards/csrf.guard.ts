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
