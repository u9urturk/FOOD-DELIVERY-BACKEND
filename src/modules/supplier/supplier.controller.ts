import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

// @UseGuards(JwtAuthGuard)
@ApiTags('Suppliers')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly service: SupplierService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm tedarikçileri listele' })
  @ApiResponse({ status: 200, description: 'Tedarikçiler başarıyla listelendi' })
  list() {
    return this.service.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Tedarikçi istatistiklerini getir' })
  @ApiResponse({ status: 200, description: 'İstatistikler başarıyla alındı' })
  getStats() {
    return this.service.getSupplierStats();
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Duruma göre tedarikçileri filtrele' })
  @ApiQuery({ name: 'status', description: 'Tedarikçi durumu (ACTIVE, INACTIVE, PENDING)', required: true })
  @ApiResponse({ status: 200, description: 'Tedarikçiler başarıyla filtrelendi' })
  getByStatus(@Query('status') status: string) {
    return this.service.findByStatus(status);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Kategoriye göre tedarikçileri filtrele' })
  @ApiQuery({ name: 'category', description: 'Tedarikçi kategorisi', required: true })
  @ApiResponse({ status: 200, description: 'Tedarikçiler başarıyla filtrelendi' })
  getByCategory(@Query('category') category: string) {
    return this.service.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile tedarikçi getir' })
  @ApiParam({ name: 'id', description: 'Tedarikçi ID' })
  @ApiResponse({ status: 200, description: 'Tedarikçi başarıyla bulundu' })
  @ApiResponse({ status: 404, description: 'Tedarikçi bulunamadı' })
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni tedarikçi oluştur' })
  @ApiResponse({ status: 201, description: 'Tedarikçi başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  create(@Body() dto: CreateSupplierDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Tedarikçi bilgilerini güncelle' })
  @ApiParam({ name: 'id', description: 'Tedarikçi ID' })
  @ApiResponse({ status: 200, description: 'Tedarikçi başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Tedarikçi bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/increment-orders')
  @ApiOperation({ summary: 'Tedarikçi toplam sipariş sayısını artır' })
  @ApiParam({ name: 'id', description: 'Tedarikçi ID' })
  @ApiResponse({ status: 200, description: 'Sipariş sayısı başarıyla artırıldı' })
  incrementOrders(@Param('id') id: string) {
    return this.service.incrementTotalOrders(id);
  }

  @Put(':id/monthly-deliveries')
  @ApiOperation({ summary: 'Aylık teslimat sayısını güncelle' })
  @ApiParam({ name: 'id', description: 'Tedarikçi ID' })
  @ApiQuery({ name: 'count', description: 'Yeni teslimat sayısı', required: true })
  @ApiResponse({ status: 200, description: 'Aylık teslimat sayısı başarıyla güncellendi' })
  updateMonthlyDeliveries(@Param('id') id: string, @Query('count') count: string) {
    return this.service.updateMonthlyDeliveries(id, parseInt(count));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Tedarikçi sil' })
  @ApiParam({ name: 'id', description: 'Tedarikçi ID' })
  @ApiResponse({ status: 200, description: 'Tedarikçi başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Tedarikçi bulunamadı' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
