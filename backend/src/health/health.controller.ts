import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) {}

    @Get()
    check() {
        const dbState = this.connection.readyState;
        const dbStates: Record<number, string> = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };
        
        return { 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: {
                status: dbStates[dbState] || 'unknown',
                name: this.connection.name || 'N/A',
            },
            env: {
                nodeEnv: process.env.NODE_ENV || 'not set',
                mongoConfigured: !!process.env.MONGODB_URI,
            }
        };
    }
}
