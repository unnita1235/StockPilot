import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Post('add')
    addStock(@Body() body: { itemId: string; quantity: number; reason: string; notes?: string }) {
        return this.stockService.addStock(body.itemId, body.quantity, body.reason, body.notes);
    }

    @Post('remove')
    removeStock(@Body() body: { itemId: string; quantity: number; reason: string; notes?: string }) {
        return this.stockService.removeStock(body.itemId, body.quantity, body.reason, body.notes);
    }

    @Get('movements')
    getMovements(@Query('itemId') itemId?: string) {
        return this.stockService.getMovements(itemId);
    }
}
