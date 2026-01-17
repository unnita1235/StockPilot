import { Controller, Post, Body, Get, Put, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockService, MovementFilters } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse, createPaginatedResponse } from '../common/api-response';
import { MovementReason, MovementType } from './stock.schema';

interface AddStockDto {
    itemId: string;
    quantity: number;
    reason: MovementReason;
    notes?: string;
    referenceNumber?: string;
    metadata?: Record<string, any>;
}

interface RemoveStockDto {
    itemId: string;
    quantity: number;
    reason: MovementReason;
    notes?: string;
    referenceNumber?: string;
    metadata?: Record<string, any>;
}

interface AdjustStockDto {
    itemId: string;
    adjustment: number;
    reason?: MovementReason;
    notes?: string;
    referenceNumber?: string;
}

interface BulkStockDto {
    operations: {
        itemId: string;
        quantity: number;
        reason: MovementReason;
        notes?: string;
        referenceNumber?: string;
    }[];
}

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
    constructor(private readonly stockService: StockService) { }

    /**
     * Add stock to an item
     * POST /stock/add
     */
    @Post('add')
    async addStock(@Body() body: AddStockDto, @Request() req) {
        const result = await this.stockService.addStock({
            itemId: body.itemId,
            quantity: body.quantity,
            reason: body.reason,
            notes: body.notes,
            userId: req.user.userId,
            referenceNumber: body.referenceNumber,
            metadata: body.metadata,
        });
        return createResponse({
            movement: result.movement,
            item: result.item,
            previousQuantity: result.previousQuantity,
            newQuantity: result.newQuantity,
        }, 'Stock added successfully');
    }

    /**
     * Remove stock from an item
     * POST /stock/remove
     */
    @Post('remove')
    async removeStock(@Body() body: RemoveStockDto, @Request() req) {
        const result = await this.stockService.removeStock({
            itemId: body.itemId,
            quantity: body.quantity,
            reason: body.reason,
            notes: body.notes,
            userId: req.user.userId,
            referenceNumber: body.referenceNumber,
            metadata: body.metadata,
        });
        return createResponse({
            movement: result.movement,
            item: result.item,
            previousQuantity: result.previousQuantity,
            newQuantity: result.newQuantity,
        }, 'Stock removed successfully');
    }

    /**
     * Adjust stock (positive or negative correction)
     * POST /stock/adjust
     */
    @Post('adjust')
    async adjustStock(@Body() body: AdjustStockDto, @Request() req) {
        const result = await this.stockService.adjustStock({
            itemId: body.itemId,
            quantity: Math.abs(body.adjustment), // Service expects positive quantity
            adjustment: body.adjustment,
            reason: body.reason || 'correction',
            notes: body.notes,
            userId: req.user.userId,
            referenceNumber: body.referenceNumber,
        });
        return createResponse({
            movement: result.movement,
            item: result.item,
            previousQuantity: result.previousQuantity,
            newQuantity: result.newQuantity,
        }, 'Stock adjusted successfully');
    }

    /**
     * Bulk add stock (multiple items in one transaction)
     * POST /stock/bulk-add
     */
    @Post('bulk-add')
    async bulkAddStock(@Body() body: BulkStockDto, @Request() req) {
        const operations = body.operations.map(op => ({
            ...op,
            userId: req.user.userId,
        }));
        const results = await this.stockService.bulkAddStock(operations);
        return createResponse(results, `Successfully added stock to ${results.length} items`);
    }

    /**
     * Get stock movements with filtering and pagination
     * GET /stock/movements
     */
    @Get('movements')
    async getMovements(
        @Query('itemId') itemId?: string,
        @Query('userId') userId?: string,
        @Query('type') type?: MovementType,
        @Query('reason') reason?: MovementReason,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        const filters: MovementFilters = {
            itemId,
            userId,
            type,
            reason,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit, 10) : 50,
            page: page ? parseInt(page, 10) : 1,
        };
        
        const result = await this.stockService.getMovements(filters);
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }

    /**
     * Get stock history for a specific item
     * GET /stock/history/:itemId
     */
    @Get('history/:itemId')
    async getItemHistory(
        @Param('itemId') itemId: string,
        @Query('limit') limit?: string,
    ) {
        const history = await this.stockService.getItemHistory(
            itemId,
            limit ? parseInt(limit, 10) : 100
        );
        return createResponse(history);
    }

    /**
     * Get stock statistics for a specific item
     * GET /stock/stats/:itemId
     */
    @Get('stats/:itemId')
    async getItemStats(@Param('itemId') itemId: string) {
        const stats = await this.stockService.getItemStats(itemId);
        return createResponse(stats);
    }

    /**
     * Quick update stock (simple adjustment)
     * PUT /stock/quick-update/:id
     */
    @Put('quick-update/:id')
    async quickUpdate(
        @Param('id') id: string,
        @Body() body: { stock: number },
        @Request() req,
    ) {
        const item = await this.stockService.quickUpdate(id, body.stock, req.user.userId);
        return createResponse(item, 'Stock updated successfully');
    }
}
