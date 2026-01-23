import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { tenantIsolationPlugin } from './common/mongoose/tenant-isolation.plugin';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockModule } from './stock/stock.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ReportsModule } from './reports/reports.module';
import { TenantModule } from './tenant/tenant.module';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { HealthController } from './health/health.controller';
import { SeedModule } from './seed/seed.module';
import { UploadModule } from './upload/upload.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        // Rate limiting - 100 requests per minute per IP
        ThrottlerModule.forRoot([{
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests
        }]),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/stockpilot', {
            connectionFactory: (connection) => {
                // Apply the tenant isolation plugin to all schemas
                connection.plugin(tenantIsolationPlugin);

                connection.on('connected', () => {
                    console.log('✅ MongoDB connected successfully');
                });
                connection.on('error', (err) => {
                    console.error('❌ MongoDB connection error:', err.message);
                });
                connection.on('disconnected', () => {
                    console.warn('⚠️ MongoDB disconnected');
                });
                return connection;
            },
        }),
        TenantModule,
        AuthModule,
        InventoryModule,
        StockModule,
        AnalyticsModule,
        SuppliersModule,
        AiModule,
        NotificationsModule,
        WebsocketModule,
        ReportsModule,
        SeedModule,
        UploadModule,
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
                index: false,
            },
        }),
    ],
    controllers: [HealthController],
    providers: [
        // Enable rate limiting globally
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(TenantMiddleware).forRoutes('*');
    }
}
