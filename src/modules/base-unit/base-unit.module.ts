import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { ErrorService } from 'src/common/services/error.service';
import { BaseUnitController } from './base-unit.controller';
import { BaseUnitService } from './base-unit.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BaseUnitController],
  providers: [BaseUnitService, ErrorService],
  exports: [BaseUnitService],
})
export class BaseUnitModule {}
