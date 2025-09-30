import { Injectable } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RecoveryDto } from './dto/recovery.dto';
import { DatabaseService } from 'src/database/database.service';
import { RolesService } from './roles/roles.service';
import { ErrorService } from '../common/services/error.service';
import { SessionService } from 'src/modules/profile/session/session.service';
import { TokenBlacklistService } from 'src/redis/tokenblacklist.servise';

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService,
    private otpService: OtpService,
    private redisService: RedisService,
    private rolesService: RolesService,
    private errorService: ErrorService,
    private sessionService: SessionService,
    private blacklist: TokenBlacklistService,

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

  async login(loginDto: LoginDto, ip: string, userAgent?: string) {
    try {
      const { username, token } = loginDto;

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

      if (!user.otpEnabled) {
        if (!user.otpSecret) {
          this.errorService.throwBusinessError('Kullanıcı OTP gizli anahtarı bulunamadı');
        }
        const isValid = this.otpService.verifyToken(user.otpSecret, token);
        if (!isValid) {
          this.errorService.throwInvalidOTP();
        }

        await this.prisma.user.update({
          where: { id: user.id },
          data: { otpEnabled: true },
        });
      } else {
        if (!user.otpSecret) {
          this.errorService.throwBusinessError('Kullanıcı OTP gizli anahtarı bulunamadı');
        }
        const isValid = this.otpService.verifyToken(user.otpSecret, token);
        if (!isValid) {
          this.errorService.throwInvalidOTP();
        }
      }

      await this.resetRateLimit(ip);

      const roles = user.userRoles.map((userRole) => userRole.role.name);
      const session = await this.sessionService.generateAndStore({ userId: user.id, ip, userAgent });
      return {
        message: 'Giriş başarılı',
        session_id: session.sessionId,
        refresh_token: session.refreshToken,
        refresh_expires_at: session.expiresAt,
        user: { id: user.id, username: user.username, roles },
      };
    } catch (error) {
      this.errorService.handleError(error, 'kullanıcı girişi');
    }
  }

  async loginWithRecoveryCode(recoveryDto: RecoveryDto, ip: string, userAgent?: string) {
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

      // Generate JWT + session
      const payload = { sub: user.id, username: user.username, roles };
      const session = await this.sessionService.generateAndStore({ userId: user.id, ip, userAgent });
      return {
        message: 'Kurtarma kodu ile giriş başarılı',
        session_id: session.sessionId,
        refresh_token: session.refreshToken,
        refresh_expires_at: session.expiresAt,
        newRecoveryCode,
        user: { id: user.id, username: user.username, roles },
      };
    } catch (error) {
      this.errorService.handleError(error, 'kurtarma kodu ile giriş');
    }
  }

  async refreshTokensFromCookie(compositeToken: string | undefined, ip: string) {
    try {
      if (!compositeToken) this.errorService.throwInvalidToken();
      if (!compositeToken.includes('.')) this.errorService.throwInvalidToken();
      const [sessionId] = compositeToken.split('.', 2);
      const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) this.errorService.throwNotFound('Oturum');
      const userId = session.userId;
      const rotated = await this.sessionService.verifyAndRotate(userId, sessionId, compositeToken);
      // fetch user for roles
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
      });
      if (!user) this.errorService.throwUserNotFound();
      const roles = user.userRoles.map((ur) => ur.role.name);
      const payload = { sub: user.id, username: user.username, roles };
      return {
        message: 'Token yenilendi',
        rotated_refresh_token: rotated.refreshToken,
        refresh_expires_at: rotated.expiresAt,
        session_id: sessionId,
        user: { id: user.id, username: user.username, roles },
      };
    } catch (error) {
      this.errorService.handleError(error, 'refresh token yenileme');
    }
  }

  async logout(userId: string, sessionId: string, jti?: string, exp?: number) {
    try {
      if (!sessionId || !jti || !exp) this.errorService.throwNotFound('Oturum');
      const ttl = exp - Math.floor(Date.now() / 1000);
      await this.blacklist.add(jti, ttl, 'logout');

      return await this.sessionService.revoke(userId, sessionId, 'logout');
    } catch (error) {
      this.errorService.handleError(error, 'çıkış yapma');
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