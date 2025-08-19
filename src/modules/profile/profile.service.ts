import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';
import { ErrorService } from 'src/common/services/error.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivityLogService, UserActivityAction } from './activity/activity-log.service';
import * as bcrypt from 'bcryptjs';
import { SessionService } from './session/session.service';
import { RateLimitService } from 'src/common/services/rate-limit.service';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: DatabaseService,
    private redis: RedisService,
    private errorService: ErrorService,
    private activity: ActivityLogService,
    private sessions: SessionService,
    private rateLimit: RateLimitService,
  ) { }

  /**
   * List all users with their roles included
   */
  async listUsersWithRoles() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          surname: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                }
              }
            }
          }
        }
      });
      return users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.userRoles.map(ur => ur.role.name)
      }));
    } catch (error) {
      this.errorService.handleError(error, 'kullanıcıları roller ile listeleme');
    }
  }

  private profileCacheKey(userId: string) {
    return `user:profile:${userId}`;
  }

  private profileCacheKeyByUsername(username: string) {
    return `user:profile:username:${username}`;
  }

  async getProfile(userId: string) {
    const cacheKey = this.profileCacheKey(userId);
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      this.errorService.logAndContinue(err, 'profile cache read');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        locale: true,
        timeZone: true,
        theme: true,
        density: true,
        notificationEmail: true,
        notificationPush: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastPasswordChangeAt: true,
      },
    });

    if (!user) this.errorService.throwUserNotFound();

    try {
      await this.redis.set(cacheKey, JSON.stringify(user), 300); // 5 dk cache
    } catch (err) {
      this.errorService.logAndContinue(err, 'profile cache write');
    }

    return user;
  }

  async getProfileByUsername(username: string) {
    const cacheKey = this.profileCacheKeyByUsername(username);
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      this.errorService.logAndContinue(err, 'profile cache read');
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        locale: true,
        timeZone: true,
        theme: true,
        density: true,
        notificationEmail: true,
        notificationPush: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lastPasswordChangeAt: true,
      },
    });
    if (!user) this.errorService.throwUserNotFound();
    try { await this.redis.set(cacheKey, JSON.stringify(user), 300); } catch (e) { this.errorService.logAndContinue(e, 'profile cache write'); }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          surname: dto.surname,
          email: dto.email,
          avatarUrl: dto.avatarUrl,
        },
        select: { id: true },
      });
      try { await this.redis.del(this.profileCacheKey(userId)); } catch (e) { this.errorService.logAndContinue(e, 'profile cache invalidate'); }
      this.activity.log(userId, 'PROFILE_UPDATE');
      return { message: 'Profil güncellendi', id: user.id };
    } catch (error) {
      this.errorService.handleError(error, 'profil güncelleme');
    }
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          locale: dto.locale,
          timeZone: dto.timeZone,
          theme: dto.theme,
          density: dto.density,
          notificationEmail: dto.notificationEmail,
          notificationPush: dto.notificationPush,
        },
        select: { id: true },
      });
      try { await this.redis.del(this.profileCacheKey(userId)); } catch (e) { this.errorService.logAndContinue(e, 'profile cache invalidate'); }
      this.activity.log(userId, 'PROFILE_UPDATE', { preferences: true });
      return { message: 'Tercihler güncellendi' };
    } catch (error) {
      this.errorService.handleError(error, 'tercih güncelleme');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto, currentSessionId?: string) {
    try {
      await this.rateLimit.checkAndIncrement(`rate:pwd_change:${userId}`, 5, 300);
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
      if (!user) this.errorService.throwUserNotFound();

      const rounds = 12;
      if (user.passwordHash) {
        if (!dto.currentPassword) this.errorService.throwBusinessError('Mevcut parola gerekli');
        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid) this.errorService.throwInvalidCredentials();
      }

      const newHash = await bcrypt.hash(dto.newPassword, rounds);
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash, lastPasswordChangeAt: new Date() },
        select: { id: true },
      });
      this.activity.log(userId, 'PASSWORD_CHANGE');
      if (currentSessionId) {
        await this.sessions.revokeAll(userId, currentSessionId);

      } else {
        await this.sessions.revokeAll(userId);
      }
      try { await this.redis.del(this.profileCacheKey(userId)); } catch (e) { this.errorService.logAndContinue(e, 'profile cache invalidate'); }
      return { message: 'Parola güncellendi' };
    } catch (error) {
      this.errorService.handleError(error, 'parola güncelleme');
    }
  }
}
