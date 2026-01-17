import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Supplier, SupplierDocument } from './supplier.schema';

export interface SupplierFilters {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
}

@Injectable()
export class SuppliersService {
    constructor(
        @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    ) { }

    async findAll(filters: SupplierFilters = {}) {
        const { search, status, category, page = 1, limit = 50 } = filters;
        const query: FilterQuery<SupplierDocument> = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (status) {
            query.status = status;
        }

        if (category) {
            query.categories = category;
        }

        const skip = (page - 1) * limit;

        const [suppliers, total] = await Promise.all([
            this.supplierModel.find(query).skip(skip).limit(limit).sort({ name: 1 }).exec(),
            this.supplierModel.countDocuments(query),
        ]);

        return {
            data: suppliers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<SupplierDocument> {
        const supplier = await this.supplierModel.findById(id).exec();
        if (!supplier) {
            throw new NotFoundException('Supplier not found');
        }
        return supplier;
    }

    async findByCode(code: string): Promise<SupplierDocument | null> {
        return this.supplierModel.findOne({ code }).exec();
    }

    async create(dto: Partial<Supplier>): Promise<SupplierDocument> {
        // Check for duplicate code
        if (dto.code) {
            const existing = await this.findByCode(dto.code);
            if (existing) {
                throw new ConflictException('Supplier code already exists');
            }
        }

        const supplier = new this.supplierModel(dto);
        return supplier.save();
    }

    async update(id: string, dto: Partial<Supplier>): Promise<SupplierDocument> {
        // Check for duplicate code if changing
        if (dto.code) {
            const existing = await this.supplierModel.findOne({ 
                code: dto.code, 
                _id: { $ne: id } 
            }).exec();
            if (existing) {
                throw new ConflictException('Supplier code already exists');
            }
        }

        const supplier = await this.supplierModel
            .findByIdAndUpdate(id, dto, { new: true })
            .exec();

        if (!supplier) {
            throw new NotFoundException('Supplier not found');
        }
        return supplier;
    }

    async remove(id: string): Promise<void> {
        const result = await this.supplierModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Supplier not found');
        }
    }

    async getActiveSuppliers(): Promise<SupplierDocument[]> {
        return this.supplierModel.find({ status: 'active' }).sort({ name: 1 }).exec();
    }

    async getSuppliersByCategory(category: string): Promise<SupplierDocument[]> {
        return this.supplierModel
            .find({ status: 'active', categories: category })
            .sort({ rating: -1 })
            .exec();
    }
}
