import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

// @UseGuards(JwtAuthGuard)
@ApiTags('Warehouses')
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm depoları listele' })
  @ApiResponse({ status: 200, description: 'Depolar başarıyla listelendi' })
  list() {
    return this.service.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Depo istatistiklerini getir' })
  @ApiResponse({ status: 200, description: 'İstatistikler başarıyla alındı' })
  getStats() {
    return this.service.getWarehouseStats();
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Duruma göre depoları filtrele' })
  @ApiQuery({ name: 'status', description: 'Depo durumu (Aktif, Pasif, Bakım)', required: true })
  @ApiResponse({ status: 200, description: 'Depolar başarıyla filtrelendi' })
  getByStatus(@Query('status') status: string) {
    return this.service.findByStatus(status);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Türe göre depoları filtrele' })
  @ApiQuery({ name: 'type', description: 'Depo türü (Normal, Soğuk, Dondurucu, Kuru)', required: true })
  @ApiResponse({ status: 200, description: 'Depolar başarıyla filtrelendi' })
  getByType(@Query('type') type: string) {
    return this.service.findByType(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile depo getir' })
  @ApiParam({ name: 'id', description: 'Depo ID' })
  @ApiResponse({ status: 200, description: 'Depo başarıyla bulundu' })
  @ApiResponse({ status: 404, description: 'Depo bulunamadı' })
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni depo oluştur' })
  @ApiResponse({ status: 201, description: 'Depo başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  create(@Body() dto: CreateWarehouseDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Depo bilgilerini güncelle' })
  @ApiParam({ name: 'id', description: 'Depo ID' })
  @ApiResponse({ status: 200, description: 'Depo başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Depo bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Depo sil' })
  @ApiParam({ name: 'id', description: 'Depo ID' })
  @ApiResponse({ status: 200, description: 'Depo başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Depo bulunamadı' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
