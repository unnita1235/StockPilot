import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireTenant } from '../common/decorators/require-tenant.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { createResponse } from '../common/api-response';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Types } from 'mongoose';

/**
 * Inventory Controller - Manages inventory items
 *
 * Security Features:
 * - All routes require JWT authentication (JwtAuthGuard)
 * - All routes require tenant scope (TenantGuard + @RequireTenant())
 * - Tenant ID is automatically extracted from request context
 * - Cross-tenant access is strictly prohibited
 */
@Controller('items')
@UseGuards(JwtAuthGuard, TenantGuard)
@RequireTenant()
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) {}

    @Get()
    async findAll(@TenantId() tenantId: Types.ObjectId) {
        const data = await this.inventoryService.findAll(tenantId);
        return createResponse(data);
    }

    @Post()
    async create(@Body() dto: CreateInventoryDto, @TenantId() tenantId: Types.ObjectId) {
        const data = await this.inventoryService.create(dto, tenantId);
        return createResponse(data, 'Item created');
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @TenantId() tenantId: Types.ObjectId) {
        const data = await this.inventoryService.findOne(id, tenantId);
        return createResponse(data);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateInventoryDto,
        @TenantId() tenantId: Types.ObjectId,
    ) {
        const data = await this.inventoryService.update(id, dto, tenantId);
        return createResponse(data, 'Item updated');
    }

    @Post(':id/movement')
    async addStockMovement(
        @Param('id') id: string,
        @Body() dto: CreateStockMovementDto,
        @TenantId() tenantId: Types.ObjectId,
    ) {
        const data = await this.inventoryService.createMovement(id, dto, tenantId);
        return createResponse(data, 'Stock movement recorded');
    }

    /**
     * Get forecast for an inventory item
     * SECURITY FIX: Now properly scoped to tenant
     */
    @Get(':id/forecast')
    async getForecast(@Param('id') id: string, @TenantId() tenantId: Types.ObjectId) {
        // First verify the item belongs to this tenant
        await this.inventoryService.findOne(id, tenantId);
        // Then get the forecast
        return this.inventoryService.getForecast(id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @TenantId() tenantId: Types.ObjectId) {
        await this.inventoryService.remove(id, tenantId);
        return createResponse(null, 'Item deleted');
    }
}
