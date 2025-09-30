import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateMovementTypeDto } from './dto/create-movement-type.dto';
import { UpdateMovementTypeDto } from './dto/update-movement-type.dto';


@Injectable()
export class MovementTypeService {
  constructor(private readonly db: DatabaseService) {}

  findAll() {
    return this.db.movementType.findMany();
  }

  findOne(id: string) {
    return this.db.movementType.findUnique({ where: { id } });
  }

  create(dto: CreateMovementTypeDto) {
    return this.db.movementType.create({ data: dto as any });
  }

  update(id: string, dto: UpdateMovementTypeDto) {
    return this.db.movementType.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.db.movementType.delete({ where: { id } });
  }
  
  // Bulk insert/seed helper
  seed(items: CreateMovementTypeDto[]) {
    return this.db.movementType.createMany({ data: items as any[], skipDuplicates: true });
  }
}
