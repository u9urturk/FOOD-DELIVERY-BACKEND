import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfService } from '../../auth/csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(private readonly csrfService: CsrfService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const csrfCookie = request.cookies?.csrf_token;
        const csrfHeader = request.headers['x-csrf-token'];
        console.log(request.headers['x-csrf-token'])
        console.log('🔒 CSRF Guard - Cookie:', csrfCookie ? 'Present' : 'Missing');
        console.log('� CSRF Guard - Header:', csrfHeader ? 'Present' : 'Missing');
        console.log('🔒 CSRF Guard - User-Agent:', request.headers['user-agent']);
        console.log('� CSRF Guard - Referer:', request.headers.referer);

        // Zone.md'ye göre: CSRF koruması için hem cookie hem header kontrolü
        if (!csrfCookie) {
            throw new ForbiddenException('CSRF token eksik - Önce /api/v1/auth/csrf endpoint\'ini çağırın');
        }

        // Double submit cookie pattern: Cookie ve header eşleşmeli
        if (!csrfHeader) {
            throw new ForbiddenException('X-CSRF-Token header\'ı eksik - Header\'da CSRF token göndermelisiniz');
        }

        if (csrfHeader !== csrfCookie) {
            throw new ForbiddenException('CSRF token eşleşmiyor - Cookie ve header\'daki token\'lar aynı olmalı');
        }

        // CSRF service ile token doğrulama
        if (!this.csrfService.validateToken(csrfCookie)) {
            throw new ForbiddenException('CSRF token geçersiz veya süresi dolmuş - Yeni token alın');
        }

        console.log('✅ CSRF validation passed');
        return true;
    }
}
