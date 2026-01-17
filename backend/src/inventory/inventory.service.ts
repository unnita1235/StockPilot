import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Inventory, InventoryDocument } from './inventory.schema';

export interface FindAllFilters {
    category?: string;
    search?: string;
    lowStock?: boolean;
}

export interface TransformedItem {
    _id: string;
    name: string;
    description: string;
    stock: number;
    category: string;
    lowStockThreshold: number;
    sku?: string;
    unitPrice?: number;
    isLowStock: boolean;
}

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    ) { }

    async findAll(filters?: FindAllFilters): Promise<TransformedItem[]> {
        const query: FilterQuery<InventoryDocument> = {};

        if (filters?.category) {
            query.category = filters.category;
        }

        if (filters?.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
            ];
        }

        if (filters?.lowStock) {
            query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
        }

        const items = await this.inventoryModel.find(query).exec();
        return items.map(item => this.transformItem(item));
    }

    async findOne(id: string): Promise<TransformedItem> {
        const item = await this.inventoryModel.findById(id).exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        return this.transformItem(item);
    }

    async create(dto: Partial<Inventory> & { stock?: number }): Promise<TransformedItem> {
        // Map frontend 'stock' to backend 'quantity'
        const createData: Partial<Inventory> = {
            name: dto.name,
            description: dto.description,
            quantity: dto.stock ?? dto.quantity ?? 0,
            category: dto.category,
            lowStockThreshold: dto.lowStockThreshold,
            unitPrice: dto.unitPrice,
            location: dto.location,
        };
        const newItem = new this.inventoryModel(createData);
        const saved = await newItem.save();
        return this.transformItem(saved);
    }

    async update(id: string, dto: Partial<Inventory> & { stock?: number }): Promise<TransformedItem> {
        // Map frontend 'stock' to backend 'quantity' if provided
        const updateData: Partial<Inventory> = { ...dto };
        if (dto.stock !== undefined) {
            updateData.quantity = dto.stock;
            delete (updateData as any).stock;
        }

        const item = await this.inventoryModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        return this.transformItem(item);
    }

    async remove(id: string): Promise<void> {
        const result = await this.inventoryModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Inventory item not found');
        }
    }

    async getLowStockItems(): Promise<TransformedItem[]> {
        const items = await this.inventoryModel
            .find({
                $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
            })
            .exec();
        return items.map(item => this.transformItem(item));
    }

    // Transform backend item to frontend format (quantity -> stock)
    private transformItem(item: InventoryDocument): TransformedItem {
        const obj = item.toObject();
        return {
            _id: obj._id.toString(),
            name: obj.name,
            description: obj.description || '',
            stock: obj.quantity, // Map quantity to stock for frontend
            category: obj.category || 'General',
            lowStockThreshold: obj.lowStockThreshold || 5,
            sku: obj.sku,
            unitPrice: obj.unitPrice,
            isLowStock: obj.quantity <= (obj.lowStockThreshold || 5),
        };
    }
}
