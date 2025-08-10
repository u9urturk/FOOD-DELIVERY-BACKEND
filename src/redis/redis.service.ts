import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client;

  constructor() {
    // Parse REDIS_URL if available, otherwise use individual env vars
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      // Use REDIS_URL (format: redis://[:password@]host:port[/db-number])
      this.client = createClient({
        url: redisUrl
      });
    } else {
      // Use individual environment variables
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });
    }
    
    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => console.log('✅ Redis connected successfully'));
    this.client.on('ready', () => console.log('🔥 Redis client ready'));
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async set(key: string, value: string, expireInSeconds?: number) {
    if (expireInSeconds) {
      return this.client.setEx(key, expireInSeconds, value);
    }
    return this.client.set(key, value);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async increment(key: string) {
    return this.client.incr(key);
  }

  async ttl(key: string) {
    return this.client.ttl(key);
  }
}