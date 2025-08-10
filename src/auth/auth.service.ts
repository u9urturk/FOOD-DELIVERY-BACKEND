import { Injectable } from '@nestjs/common';
import { OtpService } from './otp.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RecoveryDto } from './dto/recovery.dto';
import { DatabaseService } from 'src/database/database.service';
import { RolesService } from './roles/roles.service';
import { ErrorService } from '../common/services/error.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService,
    private otpService: OtpService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private rolesService: RolesService,
    private errorService: ErrorService,
  ) { }

  async register(registerDto: RegisterDto) {
    try {
      const { username } = registerDto;

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        this.errorService.throwUsernameConflict();
      }

      // Generate OTP secret
      const secret = this.otpService.generateSecret(username);
      const recoveryCode = this.otpService.generateRecoveryCode();

      // Create user
      const user = await this.prisma.user.create({
        data: {
          username,
          otpSecret: secret.base32,
          recoveryCode,
        },
      });

      // Assign default role (USER)
      const defaultRole = await this.prisma.role.findUnique({
        where: { name: 'USER' },
      });

      if (defaultRole) {
        await this.rolesService.assignRoleToUser(user.id, defaultRole.id);
      }

      // Generate QR code
      if (!secret.otpauth_url) {
        this.errorService.throwBusinessError('OTP auth URL oluşturulamadı');
      }
      const qrCode = await this.otpService.generateQRCode(secret.otpauth_url);

      return {
        message: 'Kullanıcı başarıyla kaydedildi. Google Authenticator ile QR kodu okutun.',
        qrCode,
        recoveryCode,
        secret: secret.base32,
      };
    } catch (error) {
      this.errorService.handleError(error, 'kullanıcı kaydı');
    }
  }

  async login(loginDto: LoginDto, ip: string) {
    try {
      const { username, token } = loginDto;

      // Check rate limiting
      await this.checkRateLimit(ip);

      const user = await this.prisma.user.findUnique({
        where: { username },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        this.errorService.throwUserNotFound();
      }

      // If 2FA is not enabled, this is the first login
      if (!user.otpEnabled) {
        if (!user.otpSecret) {
          this.errorService.throwBusinessError('Kullanıcı OTP gizli anahtarı bulunamadı');
        }
        const isValid = this.otpService.verifyToken(user.otpSecret, token);
        if (!isValid) {
          this.errorService.throwInvalidOTP();
        }

        // Enable 2FA
        await this.prisma.user.update({
          where: { id: user.id },
          data: { otpEnabled: true },
        });
      } else {
        // Normal OTP verification
        if (!user.otpSecret) {
          this.errorService.throwBusinessError('Kullanıcı OTP gizli anahtarı bulunamadı');
        }
        const isValid = this.otpService.verifyToken(user.otpSecret, token);
        if (!isValid) {
          this.errorService.throwInvalidOTP();
        }
      }

      // Reset rate limit on successful login
      await this.resetRateLimit(ip);

      // Extract role names
      const roles = user.userRoles.map((userRole) => userRole.role.name);

      // Generate JWT
      const payload = { sub: user.id, username: user.username, roles };
      return {
        message: 'Giriş başarılı',
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      this.errorService.handleError(error, 'kullanıcı girişi');
    }
  }

  async loginWithRecoveryCode(recoveryDto: RecoveryDto, ip: string) {
    try {
      const { username, recoveryCode } = recoveryDto;

      // Check rate limiting
      await this.checkRateLimit(ip);

      const user = await this.prisma.user.findUnique({
        where: { username },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || user.recoveryCode !== recoveryCode) {
        this.errorService.throwBusinessError('Geçersiz kurtarma kodu');
      }

      // Generate new recovery code
      const newRecoveryCode = this.otpService.generateRecoveryCode();

      // Update user with new recovery code
      await this.prisma.user.update({
        where: { id: user.id },
        data: { recoveryCode: newRecoveryCode },
      });

      // Reset rate limit on successful login
      await this.resetRateLimit(ip);

      // Extract role names
      const roles = user.userRoles.map((userRole) => userRole.role.name);

      // Generate JWT
      const payload = { sub: user.id, username: user.username, roles };
      return {
        message: 'Kurtarma kodu ile giriş başarılı',
        access_token: this.jwtService.sign(payload),
        newRecoveryCode,
      };
    } catch (error) {
      this.errorService.handleError(error, 'kurtarma kodu ile giriş');
    }
  }

  private async checkRateLimit(ip: string) {
    try {
      const key = `rate_limit:${ip}`;
      const attempts = await this.redisService.get(key);

      if (attempts && parseInt(attempts) >= 5) {
        const ttl = await this.redisService.ttl(key);
        this.errorService.throwRateLimitExceeded(ttl);
      }

      // Increment attempts
      await this.redisService.increment(key);

      // Set expiration if not set
      if (!attempts) {
        await this.redisService.set(key, '1', 300); // 5 minutes
      }
    } catch (error) {
      // If Redis is down, log but don't block the request
      this.errorService.logAndContinue(error, 'rate limit check');
    }
  }

  private async resetRateLimit(ip: string) {
    try {
      const key = `rate_limit:${ip}`;
      await this.redisService.del(key);
    } catch (error) {
      // If Redis is down, log but don't block the request
      this.errorService.logAndContinue(error, 'rate limit reset');
    }
  }
}