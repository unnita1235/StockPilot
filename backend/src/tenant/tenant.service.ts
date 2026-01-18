import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './tenant.schema';

export interface CreateTenantDto {
    name: string;
    slug: string;
    domain: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
}

export interface UpdateTenantDto {
    name?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    settings?: any;
    status?: 'active' | 'suspended' | 'inactive';
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
}

@Injectable()
export class TenantService {
    constructor(
        @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    ) {}

    async create(dto: CreateTenantDto): Promise<TenantDocument> {
        const existing = await this.tenantModel.findOne({
            $or: [{ slug: dto.slug }, { domain: dto.domain }],
        });

        if (existing) {
            throw new ConflictException('Tenant with this slug or domain already exists');
        }

        const tenant = new this.tenantModel({
            ...dto,
            settings: {
                timezone: 'UTC',
                currency: 'USD',
                dateFormat: 'YYYY-MM-DD',
                lowStockAlertEmail: dto.contactEmail,
                features: {
                    aiForecasting: dto.plan !== 'free',
                    multiWarehouse: dto.plan === 'enterprise',
                    advancedReporting: dto.plan !== 'free',
                },
            },
        });

        return tenant.save();
    }

    async findAll(): Promise<TenantDocument[]> {
        return this.tenantModel.find().sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<TenantDocument> {
        const tenant = await this.tenantModel.findById(id);
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        return tenant;
    }

    async findBySlug(slug: string): Promise<TenantDocument> {
        const tenant = await this.tenantModel.findOne({ slug });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        return tenant;
    }

    async update(id: string, dto: UpdateTenantDto): Promise<TenantDocument> {
        const tenant = await this.tenantModel.findByIdAndUpdate(
            id,
            { $set: dto },
            { new: true },
        );

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return tenant;
    }

    async delete(id: string): Promise<void> {
        const result = await this.tenantModel.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
            throw new NotFoundException('Tenant not found');
        }
    }
}
