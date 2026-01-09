import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    findAll() {
        return this.inventoryService.findAll();
    }

    @Post()
    create(@Body() dto: any) {
        return this.inventoryService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: any) {
        return this.inventoryService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.inventoryService.remove(id);
    }
}
