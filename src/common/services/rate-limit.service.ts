import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { ErrorService } from './error.service';

@Injectable()
export class RateLimitService {
  constructor(private redis: RedisService, private error: ErrorService) {}

  async checkAndIncrement(key: string, limit: number, ttlSec: number) {
    try {
      const current = await this.redis.get(key);
      if (current) {
        const attempts = parseInt(current, 10);
        if (attempts >= limit) {
          const ttl = await this.redis.ttl(key);
            this.error.throwRateLimitExceeded(ttl > 0 ? ttl : ttlSec);
        }
        await this.redis.increment(key);
      } else {
        await this.redis.set(key, '1', ttlSec);
      }
    } catch (e) {
      this.error.logAndContinue(e, 'rate limit (user)');
    }
  }

  async reset(key: string) {
    try { await this.redis.del(key); } catch (e) { this.error.logAndContinue(e, 'rate limit reset'); }
  }
}
