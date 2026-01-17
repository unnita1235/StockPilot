import { Controller, Get, Query, UseGuards, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * Get comprehensive dashboard statistics
     * GET /analytics/dashboard
     */
    @Get('dashboard')
    async getDashboard() {
        const stats = await this.analyticsService.getDashboardStats();
        return createResponse(stats);
    }

    /**
     * Get trends with configurable period
     * GET /analytics/trends?period=week|month|quarter|year
     */
    @Get('trends')
    async getTrends(@Query('period') period: string) {
        const trends = await this.analyticsService.getTrends(period || 'week');
        return createResponse(trends);
    }

    /**
     * Get low stock alerts
     * GET /analytics/alerts
     */
    @Get('alerts')
    async getAlerts() {
        const alertData = await this.analyticsService.getAlerts();
        return {
            success: true,
            data: alertData.data,
            summary: alertData.summary,
        };
    }

    /**
     * Get inventory report
     * GET /analytics/report/inventory?category=xxx
     */
    @Get('report/inventory')
    async getInventoryReport(@Query('category') category?: string) {
        const report = await this.analyticsService.getInventoryReport({ category });
        return createResponse(report);
    }

    /**
     * Get valuation report
     * GET /analytics/report/valuation
     */
    @Get('report/valuation')
    async getValuationReport() {
        const report = await this.analyticsService.getValuationReport();
        return createResponse(report);
    }

    /**
     * Get movement report
     * GET /analytics/report/movements?startDate=xxx&endDate=xxx
     */
    @Get('report/movements')
    async getMovementReport(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const report = await this.analyticsService.getMovementReport({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        return createResponse(report);
    }

    /**
     * Get turnover analysis
     * GET /analytics/report/turnover?days=30
     */
    @Get('report/turnover')
    async getTurnoverAnalysis(@Query('days') days?: string) {
        const analysis = await this.analyticsService.getTurnoverAnalysis(
            days ? parseInt(days, 10) : 30
        );
        return createResponse(analysis);
    }

    /**
     * Export inventory report as CSV
     * GET /analytics/export/inventory/csv
     */
    @Get('export/inventory/csv')
    @Header('Content-Type', 'text/csv')
    async exportInventoryCsv(
        @Res() res: Response,
        @Query('category') category?: string,
    ) {
        const report = await this.analyticsService.getInventoryReport({ category });
        
        // Generate CSV
        const headers = [
            'ID', 'Name', 'SKU', 'Category', 'Quantity', 'Unit Price', 
            'Total Value', 'Low Stock Threshold', 'Is Low Stock', 
            'Total Stock In', 'Total Stock Out', 'Turnover Rate'
        ];
        
        const rows = report.map(item => [
            item._id,
            `"${item.name.replace(/"/g, '""')}"`,
            item.sku || '',
            item.category,
            item.quantity,
            item.unitPrice.toFixed(2),
            item.totalValue.toFixed(2),
            item.lowStockThreshold,
            item.isLowStock ? 'Yes' : 'No',
            item.totalStockIn,
            item.totalStockOut,
            item.turnoverRate,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    }

    /**
     * Export valuation report as CSV
     * GET /analytics/export/valuation/csv
     */
    @Get('export/valuation/csv')
    @Header('Content-Type', 'text/csv')
    async exportValuationCsv(@Res() res: Response) {
        const report = await this.analyticsService.getValuationReport();
        
        const headers = ['Category', 'Item Count', 'Total Units', 'Total Value', 'Low Stock Count', 'Avg Item Value'];
        
        const rows = report.categories.map(cat => [
            `"${cat.category}"`,
            cat.itemCount,
            cat.totalUnits,
            cat.totalValue.toFixed(2),
            cat.lowStockCount,
            cat.averageItemValue.toFixed(2),
        ]);

        // Add totals row
        rows.push([
            '"TOTAL"',
            report.totals.totalItems,
            report.totals.totalUnits,
            report.totals.totalValue.toFixed(2),
            report.totals.totalLowStock,
            '',
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        res.setHeader('Content-Disposition', `attachment; filename="valuation-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    }

    /**
     * Export movements report as CSV
     * GET /analytics/export/movements/csv
     */
    @Get('export/movements/csv')
    @Header('Content-Type', 'text/csv')
    async exportMovementsCsv(
        @Res() res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const report = await this.analyticsService.getMovementReport({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        
        const headers = [
            'Date', 'Item Name', 'Type', 'Quantity', 'Reason', 
            'Previous Qty', 'New Qty', 'Notes', 'User'
        ];
        
        const rows = report.movements.map((mov: any) => [
            new Date(mov.createdAt).toISOString(),
            `"${(mov.itemId?.name || 'Unknown').replace(/"/g, '""')}"`,
            mov.type,
            mov.quantity,
            mov.reason,
            mov.previousQuantity,
            mov.newQuantity,
            `"${(mov.notes || '').replace(/"/g, '""')}"`,
            `"${(mov.userId?.name || 'Unknown').replace(/"/g, '""')}"`,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        res.setHeader('Content-Disposition', `attachment; filename="movements-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    }

    /**
     * Export turnover analysis as CSV
     * GET /analytics/export/turnover/csv
     */
    @Get('export/turnover/csv')
    @Header('Content-Type', 'text/csv')
    async exportTurnoverCsv(
        @Res() res: Response,
        @Query('days') days?: string,
    ) {
        const analysis = await this.analyticsService.getTurnoverAnalysis(
            days ? parseInt(days, 10) : 30
        );
        
        const headers = [
            'Item Name', 'Category', 'Current Stock', 'Stock In', 'Stock Out',
            'Daily Usage', 'Days Until Stockout', 'Turnover Rate', 'Velocity'
        ];
        
        const rows = analysis.items.map(item => [
            `"${item.name.replace(/"/g, '""')}"`,
            item.category || '',
            item.currentStock,
            item.stockIn,
            item.stockOut,
            item.dailyUsage,
            item.daysUntilStockout ?? 'N/A',
            item.turnoverRate,
            item.velocity,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        res.setHeader('Content-Disposition', `attachment; filename="turnover-analysis-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    }

    /**
     * Legacy report endpoint for backward compatibility
     * GET /analytics/report?type=xxx
     */
    @Get('report')
    async getReport(@Query('type') type: string) {
        switch (type) {
            case 'inventory':
                return createResponse(await this.analyticsService.getInventoryReport());
            case 'valuation':
                return createResponse(await this.analyticsService.getValuationReport());
            case 'turnover':
                return createResponse(await this.analyticsService.getTurnoverAnalysis());
            default:
                return createResponse({ 
                    message: `Report type '${type}' not recognized. Available types: inventory, valuation, turnover` 
                });
        }
    }
}
