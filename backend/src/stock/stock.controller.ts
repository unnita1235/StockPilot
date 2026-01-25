import { Controller, Post, Body, Get, Query, UseGuards, Put, Param, Req } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';
import { Throttle } from '@nestjs/throttler';

@Controller('stock')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Post('add')
    async addStock(
        @Body() body: { itemId: string; quantity: number; reason: string; notes?: string },
        @Req() req: any
    ) {
        const userId = req.user?._id?.toString() || req.user?.id;
        const tenantId = req.tenant?._id?.toString();
        const result = await this.stockService.addStock(body.itemId, body.quantity, body.reason, body.notes, userId, tenantId);
        return createResponse(result.updated, 'Stock increased');
    }

    @Post('remove')
    async removeStock(
        @Body() body: { itemId: string; quantity: number; reason: string; notes?: string },
        @Req() req: any
    ) {
        const userId = req.user?._id?.toString() || req.user?.id;
        const tenantId = req.tenant?._id?.toString();
        const result = await this.stockService.removeStock(body.itemId, body.quantity, body.reason, body.notes, userId, tenantId);
        return createResponse(result.updated, 'Stock decreased');
    }

    @Get('movements')
    async getMovements(@Query('itemId') itemId?: string, @Req() req?: any) {
        const tenantId = req?.tenant?._id?.toString();
        const data = await this.stockService.getMovements(itemId, tenantId);
        return createResponse(data);
    }

    @Put('quick-update/:id')
    async quickUpdate(
        @Param('id') id: string,
        @Body() body: { stock?: number; quantity?: number },
        @Req() req: any
    ) {
        const userId = req.user?._id?.toString() || req.user?.id;
        const tenantId = req.tenant?._id?.toString();
        const newStock = body.quantity ?? body.stock;
        const updated = await this.stockService.quickUpdate(id, newStock, userId, tenantId);
        return createResponse(updated, 'Stock updated');
    }
}
