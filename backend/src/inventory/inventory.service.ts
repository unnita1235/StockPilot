import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory, InventoryDocument } from './inventory.schema';
import { StockMovement, StockMovementDocument, StockMovementType } from './stock-movement.schema';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
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

        // Initial quantity handling
        const initialQuantity = data.quantity || 0;
        // Set quantity to 0 initially, we will add it via movement
        data.quantity = 0;

        const newItem = new this.inventoryModel(data);
        const savedItem = await newItem.save();

        if (initialQuantity > 0) {
            await this.createMovement(savedItem._id.toString(), {
                type: StockMovementType.IN,
                quantity: initialQuantity,
                reason: 'Initial Inventory Creation',
            }, tenantId);

            // Re-fetch to get updated quantity
            return this.inventoryModel.findById(savedItem._id).exec();
        }

        return savedItem;
    }

    async update(id: string, dto: Partial<Inventory>, tenantId?: string | Types.ObjectId): Promise<InventoryDocument> {
        const filter: any = { _id: id };
        if (tenantId) filter.tenantId = tenantId;

        // Prevent direct quantity updates
        if ('quantity' in dto) {
            delete dto.quantity;
        }

        const item = await this.inventoryModel
            .findOneAndUpdate(filter, dto, { new: true })
            .exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        return item;
    }

    async createMovement(
        inventoryId: string,
        dto: CreateStockMovementDto,
        tenantId?: string | Types.ObjectId
    ): Promise<StockMovementDocument> {
        const item = await this.findOne(inventoryId, tenantId);

        let quantityChange = dto.quantity;
        if (dto.type === StockMovementType.OUT && quantityChange > 0) {
            quantityChange = -quantityChange;
        }
        // Ensure IN adds, OUT subtracts. ADJUSTMENT takes the sign as is? 
        // Or should we enforce logic? 
        // Let's say payload quantity is always absolute for IN/OUT.
        if (dto.type === StockMovementType.IN) {
            quantityChange = Math.abs(dto.quantity);
        } else if (dto.type === StockMovementType.OUT) {
            quantityChange = -Math.abs(dto.quantity);
        }
        // For ADJUSTMENT, we respect the sign passed (e.g. +5 or -5 correction)

        const movement = new this.stockMovementModel({
            tenantId: item.tenantId,
            inventoryId: item._id,
            type: dto.type,
            quantity: quantityChange,
            reason: dto.reason,
            reference: dto.reference,
        });

        await movement.save();

        // Update inventory quantity atomically
        await this.inventoryModel.findByIdAndUpdate(inventoryId, {
            $inc: { quantity: quantityChange }
        });

        return movement;
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
