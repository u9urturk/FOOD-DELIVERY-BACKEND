import { Global, Module } from '@nestjs/common';
import { ErrorService } from './services/error.service';
import { LoggingService } from './services/logging.service';

@Global()
@Module({
  providers: [ErrorService, LoggingService],
  exports: [ErrorService, LoggingService],
})
export class CommonModule {}
