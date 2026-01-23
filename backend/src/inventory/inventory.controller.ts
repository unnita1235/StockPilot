import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { createResponse } from '../common/api-response';
import { RequestWithTenant } from '../tenant/tenant.middleware';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    async findAll(@Request() req: RequestWithTenant) {
        const tenantId = req.tenant?._id;
        const data = await this.inventoryService.findAll(tenantId);
        return createResponse(data);
    }

    @Post()
    async create(@Body() dto: CreateInventoryDto, @Request() req: RequestWithTenant) {
        const tenantId = req.tenant?._id;
        const data = await this.inventoryService.create(dto, tenantId);
        return createResponse(data, 'Item created');
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: RequestWithTenant) {
        const tenantId = req.tenant?._id;
        const data = await this.inventoryService.findOne(id, tenantId);
        return createResponse(data);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateInventoryDto, @Request() req: RequestWithTenant) {
        const tenantId = req.tenant?._id;
        const data = await this.inventoryService.update(id, dto, tenantId);
        return createResponse(data, 'Item updated');
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: RequestWithTenant) {
        const tenantId = req.tenant?._id;
        await this.inventoryService.remove(id, tenantId);
        return createResponse(null, 'Item deleted');
    }
}
