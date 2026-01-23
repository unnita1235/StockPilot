import { Controller, Get, HttpCode } from '@nestjs/common';
import { DatabaseHealthService } from '../database/database-health.service';

@Controller('health')  // NOT 'api/health' - global prefix handles that!
export class HealthController {
    constructor(private readonly databaseHealthService: DatabaseHealthService) {}

    @Get()
    @HttpCode(200)
    async healthCheck() {
        // Get comprehensive database health status
        const dbHealth = await this.databaseHealthService.getConnectionStatus();

        // Determine overall service health
        // Service is healthy if it's running, even if DB is temporarily unavailable
        const isServiceHealthy = true; // App is running
        const isDatabaseHealthy = dbHealth.isHealthy;

        // Overall status considers both service and database
        const overallStatus = isDatabaseHealthy ? 'healthy' : 'degraded';

        return {
            status: overallStatus,
            service: 'StockPilot Backend API',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: dbHealth.status,
                connected: dbHealth.connected,
                readyState: dbHealth.readyState,
                host: dbHealth.host,
                name: dbHealth.name,
                uptime: dbHealth.uptime,
                connectionAttempts: dbHealth.connectionAttempts,
                lastError: dbHealth.lastError,
                lastErrorTime: dbHealth.lastErrorTime,
            },
            checks: {
                service: isServiceHealthy,
                database: isDatabaseHealthy,
            },
        };
    }

    @Get('ping')
    @HttpCode(200)
    async ping() {
        const canPing = await this.databaseHealthService.ping();
        const stats = await this.databaseHealthService.getConnectionStats();

        return {
            status: canPing ? 'ok' : 'failed',
            timestamp: new Date().toISOString(),
            database: {
                pingSuccessful: canPing,
                ...stats,
            },
        };
    }

    @Get('detailed')
    @HttpCode(200)
    async detailedHealth() {
        const dbHealth = await this.databaseHealthService.getConnectionStatus();
        const stats = await this.databaseHealthService.getConnectionStats();
        const canPing = await this.databaseHealthService.ping();

        return {
            timestamp: new Date().toISOString(),
            service: {
                name: 'StockPilot Backend API',
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                platform: process.platform,
                nodeVersion: process.version,
            },
            database: {
                health: dbHealth,
                stats,
                pingSuccessful: canPing,
            },
            overall: {
                healthy: dbHealth.isHealthy,
                status: dbHealth.isHealthy ? 'healthy' : 'degraded',
            },
        };
    }
}
