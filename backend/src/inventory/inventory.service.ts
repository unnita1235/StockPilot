import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory, InventoryDocument } from './inventory.schema';
import { StockMovement, StockMovementDocument, StockMovementType } from './stock-movement.schema';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ForecastResultDto } from './dto/forecast-result.dto';

import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.schema';

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
        private auditService: AuditService,
    ) { }

    // Helper to get user ID - in a real app this would come from CLS/Request Context
    private getCurrentUserId(): string {
        return 'system-user'; // Placeholder
    }

    async findAll(tenantId?: string | Types.ObjectId): Promise<InventoryDocument[]> {
        const filter: any = {};
        if (tenantId) filter.tenantId = tenantId;
        return this.inventoryModel.find(filter).exec();
    }

    async findOne(id: string, tenantId?: string | Types.ObjectId): Promise<InventoryDocument> {
        if (!id || !Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid ID format');
        }
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

        await this.auditService.log({
            tenantId: savedItem.tenantId.toString(),
            userId: this.getCurrentUserId(),
            action: AuditAction.CREATE,
            entity: 'Inventory',
            entityId: savedItem._id.toString(),
            newValue: savedItem.toObject(),
        });

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
        if (!id || !Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid ID format');
        }
        const filter: any = { _id: id };
        if (tenantId) filter.tenantId = tenantId;

        // Prevent direct quantity updates
        if ('quantity' in dto) {
            delete dto.quantity;
        }

        const oldItem = await this.inventoryModel.findOne(filter).exec();
        if (!oldItem) {
            throw new NotFoundException('Inventory item not found');
        }

        const item = await this.inventoryModel
            .findOneAndUpdate(filter, dto, { new: true })
            .exec();

        await this.auditService.log({
            tenantId: item.tenantId.toString(),
            userId: this.getCurrentUserId(),
            action: AuditAction.UPDATE,
            entity: 'Inventory',
            entityId: item._id.toString(),
            oldValue: oldItem.toObject(),
            newValue: item.toObject(),
        });

        return item;
    }

    async createMovement(
        inventoryId: string,
        dto: CreateStockMovementDto,
        tenantId?: string | Types.ObjectId
    ): Promise<{ movement: StockMovementDocument; item: InventoryDocument }> {
        if (!inventoryId || !Types.ObjectId.isValid(inventoryId)) {
            throw new BadRequestException('Invalid ID format');
        }
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
        const updatedItem = await this.inventoryModel.findByIdAndUpdate(
            inventoryId,
            { $inc: { quantity: quantityChange } },
            { new: true }
        );

        return { movement, item: updatedItem };
    }

    async remove(id: string, tenantId?: string | Types.ObjectId): Promise<void> {
        if (!id || !Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid ID format');
        }
        const filter: any = { _id: id };
        if (tenantId) filter.tenantId = tenantId;

        const item = await this.inventoryModel.findOne(filter).exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }

        await this.inventoryModel.deleteOne(filter).exec();

        await this.auditService.log({
            tenantId: item.tenantId.toString(),
            userId: this.getCurrentUserId(),
            action: AuditAction.DELETE,
            entity: 'Inventory',
            entityId: item._id.toString(),
            oldValue: item.toObject(),
        });
    }

    async getLowStockItems(tenantId?: string | Types.ObjectId): Promise<InventoryDocument[]> {
        const filter: any = {
            $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
        };
        if (tenantId) filter.tenantId = tenantId;

        return this.inventoryModel.find(filter).exec();
    }

    async getForecast(inventoryId: string): Promise<ForecastResultDto> {
        if (!inventoryId || !Types.ObjectId.isValid(inventoryId)) {
            throw new BadRequestException('Invalid ID format');
        }
        const item = await this.inventoryModel.findById(inventoryId).exec();
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }

        // 1. Calculate Average Daily Consumption (ADC)
        // Look back 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const movements = await this.stockMovementModel.find({
            inventoryId: item._id,
            type: StockMovementType.OUT,
            createdAt: { $gte: thirtyDaysAgo }
        }).exec();

        let totalOut = 0;
        movements.forEach(m => {
            totalOut += Math.abs(m.quantity);
        });

        // Use 30 days for average to smooth out spikes, even if data is younger
        const adc = totalOut / 30;

        // 2. Expected Stock-out Date
        let daysUntilStockout: number | null = null;
        let stockOutDate: Date | null = null;

        if (adc > 0) {
            daysUntilStockout = item.quantity / adc;
            stockOutDate = new Date();
            stockOutDate.setDate(stockOutDate.getDate() + Math.floor(daysUntilStockout));
        }

        // 3. Recommended Reorder Quantity
        // Policy: Keep 30 days of stock (TargetDays) + 7 days LeadTime
        const targetDays = 30;
        const leadTime = 7;
        const targetStock = adc * (targetDays + leadTime);

        let reorderQuantity = targetStock - item.quantity;
        if (reorderQuantity < 0) reorderQuantity = 0;

        // Determine Status
        let status: 'Safe' | 'Low' | 'Critical' = 'Safe';
        if (daysUntilStockout !== null) {
            if (daysUntilStockout < leadTime) {
                status = 'Critical';
            } else if (daysUntilStockout < leadTime + 5) {
                status = 'Low';
            }
        }

        return {
            stockOutDate,
            reorderQuantity: Math.ceil(reorderQuantity), // Round up for safety
            dailyUsage: parseFloat(adc.toFixed(2)),
            daysUntilStockout: daysUntilStockout !== null ? Math.floor(daysUntilStockout) : null,
            status
        };
    }
}
