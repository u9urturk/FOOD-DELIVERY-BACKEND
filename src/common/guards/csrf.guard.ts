import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const csrfCookie = request.cookies?.csrf_token;
        const csrfHeader = request.headers['x-csrf-token'];
        const userAgent = request.headers['user-agent'] || '';
        
        // Safari detection
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        // HttpOnly cookie kontrolü (her zaman gerekli)
        if (!csrfCookie) {
            throw new ForbiddenException('CSRF token eksik - cookie bulunamadı');
        }

        // Safari için: header token da kontrol et
        if (isSafari) {
            if (!csrfHeader) {
                throw new ForbiddenException('CSRF token eksik - Safari için header gerekli');
            }
            
            // Token eşleşmesi kontrolü
            if (csrfHeader !== csrfCookie) {
                throw new ForbiddenException('CSRF token uyumsuzluğu');
            }
        }

        return true;
    }
}
