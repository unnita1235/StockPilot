import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.schema';
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
            limit: limit ? parseInt(limit, 10) : 20,
        });
        return createResponse(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const supplier = await this.suppliersService.findOne(id);
        return createResponse(supplier);
    }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    async create(@Body() dto: any) {
        const supplier = await this.suppliersService.create(dto);
        return createResponse(supplier, 'Supplier created successfully');
    }

    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async update(@Param('id') id: string, @Body() dto: any) {
        const supplier = await this.suppliersService.update(id, dto);
        return createResponse(supplier, 'Supplier updated successfully');
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string) {
        await this.suppliersService.remove(id);
        return createResponse(null, 'Supplier deleted successfully');
    }
}
