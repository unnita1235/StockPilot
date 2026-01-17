import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    async findAll(
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Query('lowStock') lowStock?: string,
    ) {
        const items = await this.inventoryService.findAll({ category, search, lowStock: lowStock === 'true' });
        return createResponse(items);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const item = await this.inventoryService.findOne(id);
        return createResponse(item);
    }

    @Post()
    async create(@Body() dto: any) {
        const item = await this.inventoryService.create(dto);
        return createResponse(item, 'Item created successfully');
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: any) {
        const item = await this.inventoryService.update(id, dto);
        return createResponse(item, 'Item updated successfully');
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.inventoryService.remove(id);
        return createResponse(null, 'Item deleted successfully');
    }
}
