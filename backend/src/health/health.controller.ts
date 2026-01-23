import { Controller, Get, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
    constructor(
        @Optional() @InjectConnection() private readonly connection?: Connection,
    ) {}

    @Get()
    check() {
        let dbStatus = 'not_configured';
        let dbName = 'N/A';
        
        if (this.connection) {
            const dbState = this.connection.readyState;
            const dbStates: Record<number, string> = {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting',
            };
            dbStatus = dbStates[dbState] || 'unknown';
            dbName = this.connection.name || 'N/A';
        }
        
        return { 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: {
                status: dbStatus,
                name: dbName,
            },
            env: {
                nodeEnv: process.env.NODE_ENV || 'not set',
                mongoConfigured: !!process.env.MONGODB_URI,
                port: process.env.PORT || '5000',
            }
        };
    }
}
