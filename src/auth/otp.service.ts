import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class OtpService {
  generateSecret(username: string) {
    return speakeasy.generateSecret({
      name: `Trend Restoran (${username})`,
      issuer: 'Trend Restoran',
      length: 32,
    });
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (err) {
      throw new Error('QR code generation failed');
    }
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2,
    });
  }

  generateRecoveryCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}