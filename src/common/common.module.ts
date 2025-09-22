import { Global, Module } from '@nestjs/common';
import { ErrorService } from './services/error.service';
import { LoggingService } from './services/logging.service';
import { RedisModule } from 'src/redis/redis.module';
import { TokenBlacklistService } from 'src/redis/tokenblacklist.servise';

@Global()
@Module({
  imports: [RedisModule],
  providers: [ErrorService, LoggingService, TokenBlacklistService],
  exports: [ErrorService, LoggingService],
})
export class CommonModule { }
