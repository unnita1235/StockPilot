import { Module, MiddlewareConsumer, NestModule, RequestMethod, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { join } from 'path';
import { tenantIsolationPlugin } from './common/mongoose/tenant-isolation.plugin';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockModule } from './stock/stock.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { AiModule } from './ai/ai.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ReportsModule } from './reports/reports.module';
import { TenantModule } from './tenant/tenant.module';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { HealthModule } from './health/health.module';
import { SeedModule } from './seed/seed.module';
import { UploadModule } from './upload/upload.module';
import { DatabaseModule } from './database/database.module';

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
        MongooseModule.forRootAsync({
            useFactory: () => {
                const logger = new Logger('MongooseModule');
                const isProduction = process.env.NODE_ENV === 'production';
                const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockpilot';

                logger.log(`Configuring MongoDB connection for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
                logger.log(`MongoDB URI: ${mongoUri.substring(0, 30)}...`);

                return {
                    uri: mongoUri,
                    // Connection Strategy:
                    // - Development: lazyConnection = true (allows app to start without DB)
                    // - Production: lazyConnection = false (fail-fast on DB unavailability)
                    lazyConnection: !isProduction,

                    // Retry configuration with exponential backoff
                    retryWrites: true,
                    retryAttempts: isProduction ? 10 : 5,
                    retryDelay: 2000, // Start with 2 seconds

                    // Connection timeout settings
                    serverSelectionTimeoutMS: 10000, // 10 seconds to select a server
                    connectTimeoutMS: 10000, // 10 seconds to establish connection
                    socketTimeoutMS: 45000, // 45 seconds for socket inactivity

                    // Connection pool settings for better performance
                    maxPoolSize: 10,
                    minPoolSize: 2,

                    // Automatic reconnection
                    autoIndex: !isProduction, // Don't build indexes in production
                    autoCreate: !isProduction, // Don't auto-create collections in production

                    connectionFactory: (connection) => {
                        // Apply the tenant isolation plugin to all schemas
                        connection.plugin(tenantIsolationPlugin);

                        // Enhanced connection event logging
                        connection.on('connected', () => {
                            logger.log('✅ MongoDB connected successfully');
                            logger.log(`   Host: ${connection.host}`);
                            logger.log(`   Database: ${connection.name}`);
                            logger.log(`   Ready State: ${connection.readyState}`);
                        });

                        connection.on('connecting', () => {
                            logger.log('🔄 MongoDB connecting...');
                        });

                        connection.on('error', (err) => {
                            logger.error('❌ MongoDB connection error:', err.message);

                            // Log specific error types for easier debugging
                            if (err.name === 'MongoNetworkError') {
                                logger.error('   → Network error: Check if MongoDB server is accessible');
                            } else if (err.name === 'MongoServerError') {
                                logger.error('   → Server error: Check MongoDB server logs');
                            } else if (err.name === 'MongooseServerSelectionError') {
                                logger.error('   → Server selection error: Check connection string and firewall rules');
                            }

                            // In production, we want to be notified of critical errors
                            if (isProduction) {
                                // TODO: Send alert to monitoring service (e.g., Sentry, Datadog)
                                logger.error('   → PRODUCTION ALERT: Database connection issue detected');
                            }
                        });

                        connection.on('disconnected', () => {
                            logger.warn('⚠️  MongoDB disconnected - automatic reconnection will be attempted');
                        });

                        connection.on('reconnected', () => {
                            logger.log('🔄 MongoDB reconnected successfully');
                        });

                        connection.on('close', () => {
                            logger.warn('🔒 MongoDB connection closed');
                        });

                        connection.on('reconnectFailed', () => {
                            logger.error('💥 MongoDB reconnection failed - all retry attempts exhausted');

                            if (isProduction) {
                                logger.error('   → CRITICAL: Unable to reconnect to database after multiple attempts');
                                // TODO: Trigger critical alert
                            }
                        });

                        // Log initial connection attempt
                        logger.log('MongoDB connection factory initialized');

                        return connection;
                    },
                };
            },
        }),
        DatabaseModule,
        TenantModule,
        AuthModule,
        InventoryModule,
        StockModule,
        AnalyticsModule,
        SuppliersModule,
        AiModule,
        AuditModule,
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
        HealthModule,
    ],
    controllers: [],
    providers: [
        // Enable rate limiting globally
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        // Global exception filter for consistent error responses
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(TenantMiddleware)
            .exclude(
                { path: 'api/health', method: RequestMethod.ALL },
                { path: 'health', method: RequestMethod.ALL }
            )
            .forRoutes('*');
    }
}
