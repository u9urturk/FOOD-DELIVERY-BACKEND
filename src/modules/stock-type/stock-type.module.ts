import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { ErrorService } from 'src/common/services/error.service';
import { StockTypeService } from './stock-type.service';
import { StockTypeController } from './stock-type.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [StockTypeController],
  providers: [StockTypeService, ErrorService],
  exports: [StockTypeService],
})
export class StockTypeModule {}
