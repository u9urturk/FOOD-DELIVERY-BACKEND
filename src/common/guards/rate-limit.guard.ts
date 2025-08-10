import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const key = `rate_limit:${ip}`;

    const attempts = await this.redisService.get(key);

    if (attempts && parseInt(attempts) >= 5) {
      const ttl = await this.redisService.ttl(key);
      throw new ForbiddenException(`Too many attempts. Try again in ${ttl} seconds.`);
    }

    // Increment attempts
    await this.redisService.increment(key);
    
    // Set expiration if not set
    if (!attempts) {
      await this.redisService.set(key, '1', 300); // 5 minutes
    }

    return true;
  }
}