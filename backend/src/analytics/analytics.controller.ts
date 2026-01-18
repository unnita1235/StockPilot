import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    getDashboard() {
        return this.analyticsService.getDashboardStats();
    }

    @Get('trends')
    getTrends(@Query('period') period: string) {
        return this.analyticsService.getTrends(period || 'month');
    }

    @Get('alerts')
    getAlerts() {
        return this.analyticsService.getAlerts();
    }

    @Get('report') // Matching api.ts
    getReport(@Query('type') type: string) {
        return { message: `Report generation for ${type} not implemented yet` };
    }
}
