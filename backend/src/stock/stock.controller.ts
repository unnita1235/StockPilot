import { Controller, Post, Body, Get, Query, UseGuards, Put, Param, Request } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Post('add')
    async addStock(
        @Body() body: { itemId: string; quantity: number; reason: string; notes?: string },
        @Request() req: any
    ) {
        const userId = req.user?._id?.toString() || req.user?.id;
        const result = await this.stockService.addStock(body.itemId, body.quantity, body.reason, body.notes, userId);
        return createResponse(result.updated, 'Stock increased');
    }

    @Post('remove')
    async removeStock(
        @Body() body: { itemId: string; quantity: number; reason: string; notes?: string },
        @Request() req: any
    ) {
        const userId = req.user?._id?.toString() || req.user?.id;
        const result = await this.stockService.removeStock(body.itemId, body.quantity, body.reason, body.notes, userId);
        return createResponse(result.updated, 'Stock decreased');
    }

    @Get('movements')
    async getMovements(@Query('itemId') itemId?: string) {
        const data = await this.stockService.getMovements(itemId);
        return createResponse(data);
    }

    @Put('quick-update/:id')
    async quickUpdate(
        @Param('id') id: string,
        @Body() body: { stock: number },
        @Request() req: any
    ) {
        const userId = req.user?._id?.toString() || req.user?.id;
        const updated = await this.stockService.quickUpdate(id, body.stock, userId);
        return createResponse(updated, 'Stock updated');
    }
}
