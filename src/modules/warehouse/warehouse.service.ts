import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';


@Injectable()
export class WarehouseService {
  constructor(private readonly db: DatabaseService) { }

  async findAll() {
    try {
      const warehouses = await this.db.warehouse.findMany({
        orderBy: { createdAt: 'desc' }
      });
      const stats = await this.getWarehouseStats();

      return {
        data: warehouses,
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  findOne(id: string) {
    return this.db.warehouse.findUnique({
      where: { id },
      include: {
        subInventories: true,
        inventoryFrom: true,
        inventoryTo: true
      }
    });
  }

  async create(dto: CreateWarehouseDto) {
    // Backend tarafından id, createdAt, updatedAt otomatik oluşturulacak
    const warehouseData = {
      name: dto.name,
      location: dto.location,
      capacity: dto.capacity,
      capacityPercentage: dto.capacityPercentage,
      status: dto.status as any,
      manager: dto.manager,
      staffCount: dto.staffCount,
      area: dto.area,
      temperature: dto.temperature,
      warehouseType: dto.warehouseType as any,
      code: dto.code,
      isActive: dto.isActive ?? true
    };

    return this.db.warehouse.create({
      data: warehouseData,
      include: {
        subInventories: true
      }
    });
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    // Backend tarafından updatedAt otomatik güncellenecek
    const updateData: any = {};

    // Sadece gönderilen alanları güncelle
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.capacityPercentage !== undefined) updateData.capacityPercentage = dto.capacityPercentage;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.manager !== undefined) updateData.manager = dto.manager;
    if (dto.staffCount !== undefined) updateData.staffCount = dto.staffCount;
    if (dto.area !== undefined) updateData.area = dto.area;
    if (dto.temperature !== undefined) updateData.temperature = dto.temperature;
    if (dto.warehouseType !== undefined) updateData.warehouseType = dto.warehouseType;
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.db.warehouse.update({
      where: { id },
      data: updateData,
      include: {
        subInventories: true
      }
    });
  }

  remove(id: string) {
    return this.db.warehouse.delete({ where: { id } });
  }

  // Ek yardımcı metotlar
  async findByStatus(status: string) {
    return this.db.warehouse.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByType(warehouseType: string) {
    return this.db.warehouse.findMany({
      where: { warehouseType: warehouseType as any },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getWarehouseStats() {
    const total = await this.db.warehouse.count();
    const active = await this.db.warehouse.count({ where: { isActive: true } });

    return {
      total,
      active,
      inactive: total - active
    };
  }
}
