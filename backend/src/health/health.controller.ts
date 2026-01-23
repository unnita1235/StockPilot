import { Controller, Get, HttpCode } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')  // NOT 'api/health' - global prefix handles that!
export class HealthController {
    constructor(@InjectConnection() private readonly connection: Connection) {}

    @Get()
    @HttpCode(200)
    healthCheck() {
        // Get database connection status
        let dbStatus = 'unknown';
        let dbConnected = false;

        try {
            if (this.connection && this.connection.readyState === 1) {
                dbStatus = 'connected';
                dbConnected = true;
            } else if (this.connection && this.connection.readyState === 2) {
                dbStatus = 'connecting';
            } else if (this.connection && this.connection.readyState === 0) {
                dbStatus = 'disconnected';
            } else {
                dbStatus = 'unknown';
            }
        } catch (error) {
            dbStatus = 'error';
        }

        return {
            status: 'healthy',
            service: 'StockPilot Backend API',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: dbStatus,
                connected: dbConnected,
            },
        };
    }
}
