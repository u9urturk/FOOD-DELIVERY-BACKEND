import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { OtpService } from 'src/auth/otp.service';
import { ErrorService } from 'src/common/services/error.service';
import { ActivityLogService } from '../activity/activity-log.service';

@Injectable()
export class MfaService {
  constructor(
    private prisma: DatabaseService,
    private otp: OtpService,
    private errors: ErrorService,
    private activity: ActivityLogService,
  ) {}

  private prismaAny(): any { return this.prisma as any; }

  async enable(userId: string) {
    const prismaAny = this.prismaAny();
    const user = await prismaAny.user.findUnique({ where: { id: userId } });
    if (!user) this.errors.throwUserNotFound();
    if (user.otpEnabled) this.errors.throwConflict('MFA zaten etkin');

    // Secret varsa tekrar üretmeden QR üretilebilir; güvenlik gereği aynı secret ile devam ediyoruz
    let secretBase32 = user.otpSecret;
    if (!secretBase32) {
      const secret = this.otp.generateSecret(user.username);
      secretBase32 = secret.base32;
      await prismaAny.user.update({ where: { id: userId }, data: { otpSecret: secretBase32 } });
    }

    // QR Code üret
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(user.username)}?secret=${secretBase32}&issuer=FoodDeliveryApp`;
    const qrCode = await this.otp.generateQRCode(otpauthUrl);
    return { qrCode }; // İsteme doğrultusunda sadece QR code döndürülüyor
  }

  async verify(userId: string, token: string) {
    const prismaAny = this.prismaAny();
    const user = await prismaAny.user.findUnique({ where: { id: userId } });
    if (!user) this.errors.throwUserNotFound();
    if (!user.otpSecret) this.errors.throwBusinessError('MFA gizli anahtarı yok');

    const valid = this.otp.verifyToken(user.otpSecret, token);
    if (!valid) this.errors.throwInvalidOTP();

    if (!user.otpEnabled) {
      await prismaAny.user.update({ where: { id: userId }, data: { otpEnabled: true, failedMfaAttempts: 0 } });
      this.activity.log(userId, 'MFA_ENABLED');
    }

    return { message: 'MFA doğrulandı' };
  }

  async disable(userId: string, token: string) {
    const prismaAny = this.prismaAny();
    const user = await prismaAny.user.findUnique({ where: { id: userId } });
    if (!user) this.errors.throwUserNotFound();
    if (!user.otpEnabled) return { message: 'MFA zaten pasif' };
    if (!user.otpSecret) this.errors.throwBusinessError('MFA gizli anahtarı yok');

    const valid = this.otp.verifyToken(user.otpSecret, token);
    if (!valid) this.errors.throwInvalidOTP();

    await prismaAny.user.update({ where: { id: userId }, data: { otpEnabled: false } });
    this.activity.log(userId, 'MFA_DISABLED');
    return { message: 'MFA devre dışı bırakıldı' };
  }
}
