import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CsrfService {
  private readonly tokenStore = new Map<string, number>(); // token -> timestamp
  private readonly TOKEN_EXPIRY = 60 * 60 * 1000; // 1 saat

  generateToken(): string {
    // Zone.md'ye göre: Güçlü rastgele token üretimi
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token'ı geçici olarak sakla (production'da Redis kullanılmalı)
    this.tokenStore.set(token, Date.now());
    
    // Eski token'ları temizle
    this.cleanupExpiredTokens();
    
    return token;
  }

  validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const timestamp = this.tokenStore.get(token);
    if (!timestamp) {
      return false;
    }

    // Token süresi kontrolü
    if (Date.now() - timestamp > this.TOKEN_EXPIRY) {
      this.tokenStore.delete(token);
      return false;
    }

    return true;
  }

  revokeToken(token: string): void {
    this.tokenStore.delete(token);
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, timestamp] of this.tokenStore.entries()) {
      if (now - timestamp > this.TOKEN_EXPIRY) {
        this.tokenStore.delete(token);
      }
    }
  }
}
