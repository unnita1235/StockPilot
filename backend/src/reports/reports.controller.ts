import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService, ReportFilter } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get('inventory')
    @Roles('admin', 'manager')
    async getInventoryReport(@Query() filter: ReportFilter) {
        return this.reportsService.generateInventoryReport(filter);
    }

    @Get('export/excel')
    @Roles('admin', 'manager')
    async exportToExcel(
        @Query() filter: ReportFilter,
        @Res() res: Response,
    ): Promise<void> {
        const data = await this.reportsService.generateInventoryReport(filter);
        await this.reportsService.exportToExcel(data, res);
    }

    @Get('export/pdf')
    @Roles('admin', 'manager')
    async exportToPDF(
        @Query() filter: ReportFilter,
        @Res() res: Response,
    ): Promise<void> {
        const data = await this.reportsService.generateInventoryReport(filter);
        await this.reportsService.exportToPDF(data, res);
    }
}
