import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    async getDashboard(@Req() req) {
        // Safe access to tenant ID (fallback to null if not set, though middleware ensures it)
        const tenantId = req.tenant?._id?.toString();
        const data = await this.analyticsService.getDashboardStats(tenantId);
        return createResponse(data);
    }

    @Get('trends')
    async getTrends(@Query('period') period: string, @Req() req) {
        const tenantId = req.tenant?._id?.toString();
        const data = await this.analyticsService.getTrends(tenantId, period || '7d');
        return createResponse(data);
    }

    @Get('alerts')
    async getAlerts(@Req() req) {
        const tenantId = req.tenant?._id?.toString();
        const result = await this.analyticsService.getAlerts(tenantId);
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
