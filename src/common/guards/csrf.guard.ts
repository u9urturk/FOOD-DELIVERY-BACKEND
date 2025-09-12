import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfService } from '../../auth/csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(private readonly csrfService: CsrfService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const csrfCookie = request.cookies?.csrf_token;
        const csrfHeader = request.headers['x-csrf-token'];

        // Zone.md'ye göre: CSRF koruması için hem cookie hem header kontrolü
        if (!csrfCookie) {
            throw new ForbiddenException('CSRF token eksik');
        }

        // Double submit cookie pattern: Cookie ve header eşleşmeli
        if (!csrfHeader || csrfHeader !== csrfCookie) {
            throw new ForbiddenException('CSRF token doğrulama hatası');
        }

        // CSRF service ile token doğrulama
        if (!this.csrfService.validateToken(csrfCookie)) {
            throw new ForbiddenException('CSRF token geçersiz veya süresi dolmuş');
        }

        return true;
    }
}
