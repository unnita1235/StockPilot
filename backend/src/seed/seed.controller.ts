import { Controller, Post, Get, Query } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) {}

    /**
     * Seed the database with initial data
     * Use ?force=true to clear existing data first
     * Protected by a secret key in production
     */
    @Post()
    async seed(@Query('force') force: string, @Query('key') key: string) {
        // Simple protection - in production use a proper secret
        const seedKey = process.env.SEED_SECRET_KEY || 'stockpilot-seed-2024';
        if (key !== seedKey) {
            return { success: false, message: 'Invalid seed key' };
        }
        
        const shouldForce = force === 'true';
        return this.seedService.seedDatabase(shouldForce);
    }

    @Get('status')
    async getStatus() {
        return this.seedService.getStatus();
    }
}
