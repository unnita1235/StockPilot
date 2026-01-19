import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory, InventoryDocument } from './inventory.schema';

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    ) { }

    async findAll(tenantId?: string | Types.ObjectId): Promise<InventoryDocument[]> {
        const filter: any = {};
        if (tenantId) filter.tenantId = tenantId;
        return this.inventoryModel.find(filter).exec();
    }

    async findOne(id: string, tenantId?: string | Types.ObjectId): Promise<InventoryDocument> {
        const filter: any = { _id: id };
        if (tenantId) filter.tenantId = tenantId;
        
        const item = await this.inventoryModel.findOne(filter).exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        return item;
    }

    async create(dto: Partial<Inventory>, tenantId?: string | Types.ObjectId): Promise<InventoryDocument> {
        const data = { ...dto };
        if (tenantId) {
            data.tenantId = typeof tenantId === 'string' ? new Types.ObjectId(tenantId) : tenantId;
        }
        const newItem = new this.inventoryModel(data);
        return newItem.save();
    }

    async update(id: string, dto: Partial<Inventory>, tenantId?: string | Types.ObjectId): Promise<InventoryDocument> {
        const filter: any = { _id: id };
        if (tenantId) filter.tenantId = tenantId;
        
        const item = await this.inventoryModel
            .findOneAndUpdate(filter, dto, { new: true })
            .exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        return item;
    }

    async remove(id: string, tenantId?: string | Types.ObjectId): Promise<void> {
        const filter: any = { _id: id };
        if (tenantId) filter.tenantId = tenantId;
        
        const result = await this.inventoryModel.findOneAndDelete(filter).exec();
        if (!result) {
            throw new NotFoundException('Inventory item not found');
        }
    }

    async getLowStockItems(tenantId?: string | Types.ObjectId): Promise<InventoryDocument[]> {
        const filter: any = {
            $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
        };
        if (tenantId) filter.tenantId = tenantId;
        
        return this.inventoryModel.find(filter).exec();
    }
}
