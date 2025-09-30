import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { MovementTypeController } from './movement-type.controller';
import { MovementTypeService } from './movement-type.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MovementTypeController],
  providers: [MovementTypeService],
  exports: [MovementTypeService],
})
export class MovementTypeModule {}
