import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';


@Injectable()
export class InventoryMovementService {
  constructor(private readonly db: DatabaseService) {}

  findAll(filter?: { productId?: string }) {
    return this.db.inventoryMovement.findMany({ where: filter || {}, orderBy: { timestamp: 'desc' } });
  }

  findOne(id: string) {
    return this.db.inventoryMovement.findUnique({ where: { id } });
  }

  create(dto: CreateInventoryMovementDto) {
    return this.db.inventoryMovement.create({ data: dto as any });
  }

  update(id: string, dto: UpdateInventoryMovementDto) {
    return this.db.inventoryMovement.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.db.inventoryMovement.delete({ where: { id } });
  }
}
