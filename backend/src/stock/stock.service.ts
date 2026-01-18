import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument } from './stock.schema';
import { Inventory, InventoryDocument } from '../inventory/inventory.schema';

@Injectable()
export class StockService {
    constructor(
        @InjectModel(StockMovement.name) private stockModel: Model<StockMovementDocument>,
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    ) { }

    async addStock(itemId: string, quantity: number, reason: string, notes: string = '') {
        const item = await this.inventoryModel.findById(itemId);
        if (!item) throw new NotFoundException('Item not found');

        item.quantity += quantity;
        await item.save();

        const movement = new this.stockModel({
            itemId,
            type: 'IN',
            quantity,
            reason,
            notes,
        });
        return movement.save();
    }

    async removeStock(itemId: string, quantity: number, reason: string, notes: string = '') {
        const item = await this.inventoryModel.findById(itemId);
        if (!item) throw new NotFoundException('Item not found');

        if (item.quantity < quantity) {
            throw new Error('Insufficient stock');
        }

        item.quantity -= quantity;
        await item.save();

        const movement = new this.stockModel({
            itemId,
            type: 'OUT',
            quantity,
            reason,
            notes,
        });
        return movement.save();
    }

    async getMovements(itemId?: string) {
        const filter = itemId ? { itemId } : {};
        return this.stockModel.find(filter).sort({ createdAt: -1 }).populate('itemId', 'name').exec();
    }
}
