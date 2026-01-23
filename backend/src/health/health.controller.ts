import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller('health')  // NOT 'api/health' - global prefix handles that!
export class HealthController {
    @Get()
    @HttpCode(200)
    healthCheck() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }
}
