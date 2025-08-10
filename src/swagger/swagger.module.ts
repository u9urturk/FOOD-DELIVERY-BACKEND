import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class SwaggerModule {
  static forRoot(): DynamicModule {
    return {
      module: SwaggerModule,
      global: true,
    };
  }
}