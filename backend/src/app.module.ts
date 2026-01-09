import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryModule } from './inventory/inventory.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { StockModule } from './stock/stock.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/stockpilot'),
        InventoryModule,
        AuthModule,
        StockModule,
        AnalyticsModule,
    ],
})
export class AppModule { }
