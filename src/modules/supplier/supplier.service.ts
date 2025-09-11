import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';


@Injectable()
export class SupplierService {
  constructor(private readonly db: DatabaseService) {}

  findAll() {
    return this.db.supplier.findMany();
  }

  findOne(id: string) {
    return this.db.supplier.findUnique({ where: { id } });
  }

  create(dto: CreateSupplierDto) {
    return this.db.supplier.create({ data: dto as any });
  }

  update(id: string, dto: UpdateSupplierDto) {
    return this.db.supplier.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.db.supplier.delete({ where: { id } });
  }
}
