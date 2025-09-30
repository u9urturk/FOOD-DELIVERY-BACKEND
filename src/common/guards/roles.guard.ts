import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      return false;
    }

    // Redis cache key for user roles
    const cacheKey = `user_roles:${user.userId}`;

    // Try to get from cache first
    let userRoles = await this.redisService.get(cacheKey);

    if (!userRoles) {
      // If not in cache, fetch from database
      userRoles = user.roles;
      // Cache for 5 minutes
      await this.redisService.set(cacheKey, JSON.stringify(userRoles), 300);
    } else {
      userRoles = JSON.parse(userRoles);
    }

    return requiredRoles.some((role) => userRoles.includes(role));
  }
}