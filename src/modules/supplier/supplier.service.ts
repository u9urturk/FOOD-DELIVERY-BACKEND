import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';


@Injectable()
export class SupplierService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const suppliers = await this.db.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        inventories: true
      }
    });

    const stats = await this.getSupplierStats();

    return {
      data: suppliers,
      total: stats.total,
      active: stats.active,
      inactive: stats.inactive
    };
  }

  findOne(id: string) {
    return this.db.supplier.findUnique({ 
      where: { id },
      include: {
        inventories: true
      }
    });
  }

  async create(dto: CreateSupplierDto) {
    // Backend tarafından otomatik oluşturulan alanlar: id, totalOrders, monthlyDeliveries, createdAt, updatedAt
    const supplierData = {
      name: dto.name,
      category: dto.category,
      phone: dto.phone,
      email: dto.email,
      rating: dto.rating,
      status: dto.status as any,
      address: dto.address,
      contactPerson: dto.contactPerson,
      taxNumber: dto.taxNumber,
      paymentTerms: dto.paymentTerms,
      deliveryTime: dto.deliveryTime,
      minimumOrder: dto.minimumOrder,
      products: dto.products,
      contractStartDate: dto.contractStartDate ? new Date(dto.contractStartDate) : null,
      contractEndDate: dto.contractEndDate ? new Date(dto.contractEndDate) : null,
      // Legacy fields
      contactInfo: dto.contactInfo,
      leadTimeDays: dto.leadTimeDays,
      isActive: dto.isActive ?? true
    };

    return this.db.supplier.create({ 
      data: supplierData,
      include: {
        inventories: true
      }
    });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    // Backend tarafından updatedAt otomatik güncellenecek
    const updateData: any = {};
    
    // Sadece gönderilen alanları güncelle
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.contactPerson !== undefined) updateData.contactPerson = dto.contactPerson;
    if (dto.taxNumber !== undefined) updateData.taxNumber = dto.taxNumber;
    if (dto.paymentTerms !== undefined) updateData.paymentTerms = dto.paymentTerms;
    if (dto.deliveryTime !== undefined) updateData.deliveryTime = dto.deliveryTime;
    if (dto.minimumOrder !== undefined) updateData.minimumOrder = dto.minimumOrder;
    if (dto.products !== undefined) updateData.products = dto.products;
    if (dto.contractStartDate !== undefined) updateData.contractStartDate = dto.contractStartDate ? new Date(dto.contractStartDate) : null;
    if (dto.contractEndDate !== undefined) updateData.contractEndDate = dto.contractEndDate ? new Date(dto.contractEndDate) : null;
    
    // Legacy fields
    if (dto.contactInfo !== undefined) updateData.contactInfo = dto.contactInfo;
    if (dto.leadTimeDays !== undefined) updateData.leadTimeDays = dto.leadTimeDays;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.db.supplier.update({ 
      where: { id }, 
      data: updateData,
      include: {
        inventories: true
      }
    });
  }

  remove(id: string) {
    return this.db.supplier.delete({ where: { id } });
  }

  // Ek yardımcı metotlar
  async findByStatus(status: string) {
    return this.db.supplier.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByCategory(category: string) {
    return this.db.supplier.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSupplierStats() {
    const total = await this.db.supplier.count();
    const active = await this.db.supplier.count({ where: { isActive: true } });
    const byStatus = await this.db.supplier.groupBy({
      by: ['status'],
      _count: true
    });

    return {
      total,
      active,
      inactive: total - active,
      byStatus
    };
  }

  async incrementTotalOrders(id: string) {
    return this.db.supplier.update({
      where: { id },
      data: {
        totalOrders: {
          increment: 1
        }
      }
    });
  }

  async updateMonthlyDeliveries(id: string, count: number) {
    return this.db.supplier.update({
      where: { id },
      data: {
        monthlyDeliveries: count
      }
    });
  }
}
