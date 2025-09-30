import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AccessTokenPayload {
  sub: string; 
  username: string;
  roles: string[];
  sid: string; 
  iat?: number; 
  exp?: number; 
  jti?: string; 
}

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  buildPayload(params: { userId: string; username: string; roles: string[]; sessionId: string }): AccessTokenPayload {
    const { userId, username, roles, sessionId } = params;
    
    return { 
      sub: userId, 
      username, 
      roles: roles || [],
      sid: sessionId,
      jti: this.generateJti(), 
    };
  }

  signAccessToken(payload: AccessTokenPayload): string {
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
    return require('crypto').randomBytes(16).toString('hex');
  }
}
