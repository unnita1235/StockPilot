import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    async getDashboard() {
        const data = await this.analyticsService.getDashboardStats();
        return createResponse(data);
    }

    @Get('trends')
    async getTrends(@Query('period') period: string) {
        const data = await this.analyticsService.getTrends(period || '7d');
        return createResponse(data);
    }

    @Get('alerts')
    async getAlerts() {
        const result = await this.analyticsService.getAlerts();
        return {
            success: true,
            data: result.data,
            summary: result.summary,
        };
    }

    @Get('report')
    getReport(@Query('type') type: string) {
        return createResponse({ message: `Report generation for ${type} coming soon` });
    }
}
