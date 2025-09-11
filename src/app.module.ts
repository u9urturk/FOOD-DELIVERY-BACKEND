import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from './auth/roles/roles.module';
import { PermissionsModule } from './auth/permissions/permissions.module';
import { RedisModule } from './redis/redis.module';
import { CommonModule } from './common/common.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { ProfileModule } from './modules/profile/profile.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { StockTypeModule } from './modules/stock-type/stock-type.module';
import { BaseUnitModule } from './modules/base-unit/base-unit.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { InventoryMovementModule } from './modules/inventory-movement/inventory-movement.module';
import { MovementTypeModule } from './modules/movement-type/movement-type.module';
import { SupplierModule } from './modules/supplier/supplier.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      cache: true,
      expandVariables: true,
    }),
    CommonModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    RedisModule,
    ProfileModule,
    RealtimeModule,
    ProductModule,
    CategoryModule,
    StockTypeModule,
    BaseUnitModule,
    InventoryModule,
    WarehouseModule,
    InventoryMovementModule,
    MovementTypeModule,
    SupplierModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }