import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TenantService, CreateTenantDto, UpdateTenantDto } from './tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
    constructor(private readonly tenantService: TenantService) {}

    @Post()
    @Roles('admin')
    async create(@Body() dto: CreateTenantDto) {
        return this.tenantService.create(dto);
    }

    @Get()
    @Roles('admin')
    async findAll() {
        return this.tenantService.findAll();
    }

    @Get(':id')
    @Roles('admin')
    async findOne(@Param('id') id: string) {
        return this.tenantService.findOne(id);
    }

    @Put(':id')
    @Roles('admin')
    async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
        return this.tenantService.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin')
    async delete(@Param('id') id: string) {
        await this.tenantService.delete(id);
        return { message: 'Tenant deleted successfully' };
    }
}
