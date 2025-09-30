import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { ErrorService } from 'src/common/services/error.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InventoryController],
  providers: [InventoryService, ErrorService],
  exports: [InventoryService],
})
export class InventoryModule {}
