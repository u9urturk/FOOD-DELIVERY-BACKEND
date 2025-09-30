import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { InventoryMovementController } from './inventory-movement.controller';
import { InventoryMovementService } from './inventory-movement.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InventoryMovementController],
  providers: [InventoryMovementService],
  exports: [InventoryMovementService],
})
export class InventoryMovementModule {}
