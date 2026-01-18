import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from './inventory.schema';

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    ) { }

    async findAll(): Promise<InventoryDocument[]> {
        return this.inventoryModel.find().exec();
    }

    async findOne(id: string): Promise<InventoryDocument> {
        const item = await this.inventoryModel.findById(id).exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        return item;
    }

    async create(dto: Partial<Inventory>): Promise<InventoryDocument> {
        const newItem = new this.inventoryModel(dto);
        return newItem.save();
    }

    async update(id: string, dto: Partial<Inventory>): Promise<InventoryDocument> {
        const item = await this.inventoryModel
            .findByIdAndUpdate(id, dto, { new: true })
            .exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        return item;
    }

    async remove(id: string): Promise<void> {
        const result = await this.inventoryModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Inventory item not found');
        }
    }

    async getLowStockItems(): Promise<InventoryDocument[]> {
        return this.inventoryModel
            .find({
                $expr: { $lte: ['$quantity', '$threshold'] },
            })
            .exec();
    }
}
