import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';


@Injectable()
export class WarehouseService {
  constructor(private readonly db: DatabaseService) {}

  findAll() {
    return this.db.warehouse.findMany();
  }

  findOne(id: string) {
    return this.db.warehouse.findUnique({ where: { id } });
  }

  create(dto: CreateWarehouseDto) {
    return this.db.warehouse.create({ data: dto });
  }

  update(id: string, dto: UpdateWarehouseDto) {
    return this.db.warehouse.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.db.warehouse.delete({ where: { id } });
  }
}
