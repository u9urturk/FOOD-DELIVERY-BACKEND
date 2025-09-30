import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class TokenBlacklistService {
    private prefix = 'bl:';

    constructor(private readonly redis: RedisService) { }

    private key(id: string) {
        return `${this.prefix}${id}`;
    }

    async add(jti: string, ttl: number, reason?: string) {
        await this.redis.set(this.key(jti), reason ?? '1', ttl > 0 ? ttl : 1);
    }

    async isBlacklisted(jti: string): Promise<boolean> {
        const val = await this.redis.get(this.key(jti));
        return val !== null;
    }

    async remove(jti: string) {
        await this.redis.del(this.key(jti));
    }
}
