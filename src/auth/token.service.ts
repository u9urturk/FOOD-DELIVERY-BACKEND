import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AccessTokenPayload {
  sub: string; // user id
  username: string;
  roles: string[];
  sid: string; // session id
  iat?: number; // issued at
  exp?: number; // expires at
  jti?: string; // jwt id (token rotation için)
}

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  buildPayload(params: { userId: string; username: string; roles: string[]; sessionId: string }): AccessTokenPayload {
    const { userId, username, roles, sessionId } = params;
    
    // Zone.md'ye göre: Token payload güvenliği
    return { 
      sub: userId, 
      username, 
      roles: roles || [], // Boş array varsayılan
      sid: sessionId,
      jti: this.generateJti(), // Token rotation için
    };
  }

  signAccessToken(payload: AccessTokenPayload): string {
    // Zone.md'ye göre: Kısa ömürlü access token
    const expiresIn = process.env.ACCESS_TOKEN_TTL || '15m';
    
    return this.jwt.sign(payload, {
      expiresIn,
      issuer: 'food-delivery-backend',
      audience: 'food-delivery-frontend',
    });
  }

  verifyToken(token: string): AccessTokenPayload | null {
    try {
      const payload = this.jwt.verify(token, {
        issuer: 'food-delivery-backend',
        audience: 'food-delivery-frontend',
      });
      return payload as AccessTokenPayload;
    } catch (error) {
      return null;
    }
  }

  private generateJti(): string {
    // JWT ID için güvenli rastgele string
    return require('crypto').randomBytes(16).toString('hex');
  }
}
