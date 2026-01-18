import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { createResponse } from '../common/api-response';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    @Get()
    async findAll(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('category') category?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.suppliersService.findAll({
            search,
            status,
            category,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
        });
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }

    @Get('active')
    async getActiveSuppliers() {
        const suppliers = await this.suppliersService.getActiveSuppliers();
        return createResponse(suppliers);
    }

    @Get('by-category/:category')
    async getSuppliersByCategory(@Param('category') category: string) {
        const suppliers = await this.suppliersService.getSuppliersByCategory(category);
        return createResponse(suppliers);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const supplier = await this.suppliersService.findOne(id);
        return createResponse(supplier);
    }

    @Post()
    @Roles('admin', 'manager')
    async create(@Body() dto: any) {
        const supplier = await this.suppliersService.create(dto);
        return createResponse(supplier, 'Supplier created successfully');
    }

    @Put(':id')
    @Roles('admin', 'manager')
    async update(@Param('id') id: string, @Body() dto: any) {
        const supplier = await this.suppliersService.update(id, dto);
        return createResponse(supplier, 'Supplier updated successfully');
    }

    @Delete(':id')
    @Roles('admin')
    async remove(@Param('id') id: string) {
        await this.suppliersService.remove(id);
        return createResponse(null, 'Supplier deleted successfully');
    }
}
