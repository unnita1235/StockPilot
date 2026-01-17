import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession } from 'mongoose';
import { StockMovement, StockMovementDocument, MovementType, MovementReason } from './stock.schema';
import { Inventory, InventoryDocument, StockHistoryEntry } from '../inventory/inventory.schema';

export interface StockOperationInput {
    itemId: string;
    quantity: number;
    reason: MovementReason;
    notes?: string;
    userId: string;
    referenceNumber?: string;
    metadata?: Record<string, any>;
}

export interface StockOperationResult {
    movement: StockMovementDocument;
    item: TransformedItem;
    previousQuantity: number;
    newQuantity: number;
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
    totalStockIn: number;
    totalStockOut: number;
    lastRestockDate?: Date;
    lastSaleDate?: Date;
}

export interface MovementFilters {
    itemId?: string;
    userId?: string;
    type?: MovementType;
    reason?: MovementReason;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    page?: number;
}

@Injectable()
export class StockService {
    constructor(
        @InjectModel(StockMovement.name) private stockModel: Model<StockMovementDocument>,
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectConnection() private connection: Connection,
    ) { }

    /**
     * Add stock with transaction support to prevent race conditions
     */
    async addStock(input: StockOperationInput): Promise<StockOperationResult> {
        const { itemId, quantity, reason, notes = '', userId, referenceNumber, metadata } = input;

        if (quantity <= 0) {
            throw new BadRequestException('Quantity must be positive');
        }

        const session = await this.connection.startSession();
        
        try {
            let result: StockOperationResult;
            
            await session.withTransaction(async () => {
                // Find and lock the item with optimistic locking
                const item = await this.inventoryModel.findById(itemId).session(session);
                if (!item) {
                    throw new NotFoundException('Item not found');
                }

                const previousQuantity = item.quantity;
                const newQuantity = previousQuantity + quantity;

                // Update inventory with atomic operation
                item.quantity = newQuantity;
                item.totalStockIn = (item.totalStockIn || 0) + quantity;
                item.lastRestockDate = new Date();
                item.lastModifiedBy = userId as any;

                // Add to recent history (keep last 50)
                const historyEntry: StockHistoryEntry = {
                    action: 'IN',
                    quantity,
                    previousQuantity,
                    newQuantity,
                    userId: userId as any,
                    reason,
                    notes,
                    timestamp: new Date(),
                };
                
                item.recentHistory = [historyEntry, ...(item.recentHistory || [])].slice(0, 50);
                
                await item.save({ session });

                // Create movement record
                const movement = new this.stockModel({
                    itemId,
                    userId,
                    type: 'IN',
                    quantity,
                    reason,
                    notes,
                    previousQuantity,
                    newQuantity,
                    referenceNumber,
                    metadata,
                });
                await movement.save({ session });

                result = {
                    movement,
                    item: this.transformItem(item),
                    previousQuantity,
                    newQuantity,
                };
            });

            return result!;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Remove stock with transaction support to prevent race conditions
     */
    async removeStock(input: StockOperationInput): Promise<StockOperationResult> {
        const { itemId, quantity, reason, notes = '', userId, referenceNumber, metadata } = input;

        if (quantity <= 0) {
            throw new BadRequestException('Quantity must be positive');
        }

        const session = await this.connection.startSession();
        
        try {
            let result: StockOperationResult;
            
            await session.withTransaction(async () => {
                // Find and lock the item
                const item = await this.inventoryModel.findById(itemId).session(session);
                if (!item) {
                    throw new NotFoundException('Item not found');
                }

                const previousQuantity = item.quantity;
                
                if (previousQuantity < quantity) {
                    throw new BadRequestException(
                        `Insufficient stock. Available: ${previousQuantity}, Requested: ${quantity}`
                    );
                }

                const newQuantity = previousQuantity - quantity;

                // Update inventory with atomic operation
                item.quantity = newQuantity;
                item.totalStockOut = (item.totalStockOut || 0) + quantity;
                
                // Update lastSaleDate if reason is 'sale'
                if (reason === 'sale') {
                    item.lastSaleDate = new Date();
                }
                item.lastModifiedBy = userId as any;

                // Add to recent history (keep last 50)
                const historyEntry: StockHistoryEntry = {
                    action: 'OUT',
                    quantity,
                    previousQuantity,
                    newQuantity,
                    userId: userId as any,
                    reason,
                    notes,
                    timestamp: new Date(),
                };
                
                item.recentHistory = [historyEntry, ...(item.recentHistory || [])].slice(0, 50);
                
                await item.save({ session });

                // Create movement record
                const movement = new this.stockModel({
                    itemId,
                    userId,
                    type: 'OUT',
                    quantity,
                    reason,
                    notes,
                    previousQuantity,
                    newQuantity,
                    referenceNumber,
                    metadata,
                });
                await movement.save({ session });

                result = {
                    movement,
                    item: this.transformItem(item),
                    previousQuantity,
                    newQuantity,
                };
            });

            return result!;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Adjust stock (can be positive or negative) - for corrections
     */
    async adjustStock(input: StockOperationInput & { adjustment: number }): Promise<StockOperationResult> {
        const { itemId, adjustment, reason = 'correction', notes = '', userId, referenceNumber, metadata } = input;

        if (adjustment === 0) {
            throw new BadRequestException('Adjustment cannot be zero');
        }

        const session = await this.connection.startSession();
        
        try {
            let result: StockOperationResult;
            
            await session.withTransaction(async () => {
                const item = await this.inventoryModel.findById(itemId).session(session);
                if (!item) {
                    throw new NotFoundException('Item not found');
                }

                const previousQuantity = item.quantity;
                const newQuantity = previousQuantity + adjustment;

                if (newQuantity < 0) {
                    throw new BadRequestException(
                        `Adjustment would result in negative stock. Current: ${previousQuantity}, Adjustment: ${adjustment}`
                    );
                }

                item.quantity = newQuantity;
                item.lastModifiedBy = userId as any;

                // Update totals based on adjustment direction
                if (adjustment > 0) {
                    item.totalStockIn = (item.totalStockIn || 0) + adjustment;
                } else {
                    item.totalStockOut = (item.totalStockOut || 0) + Math.abs(adjustment);
                }

                const historyEntry: StockHistoryEntry = {
                    action: 'ADJUST',
                    quantity: Math.abs(adjustment),
                    previousQuantity,
                    newQuantity,
                    userId: userId as any,
                    reason,
                    notes: notes || `Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`,
                    timestamp: new Date(),
                };
                
                item.recentHistory = [historyEntry, ...(item.recentHistory || [])].slice(0, 50);
                
                await item.save({ session });

                const movement = new this.stockModel({
                    itemId,
                    userId,
                    type: 'ADJUST',
                    quantity: Math.abs(adjustment),
                    reason,
                    notes,
                    previousQuantity,
                    newQuantity,
                    referenceNumber,
                    metadata: { ...metadata, adjustmentValue: adjustment },
                });
                await movement.save({ session });

                result = {
                    movement,
                    item: this.transformItem(item),
                    previousQuantity,
                    newQuantity,
                };
            });

            return result!;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Quick update - simple stock adjustment without full audit
     */
    async quickUpdate(itemId: string, newStock: number, userId: string): Promise<TransformedItem> {
        if (newStock < 0) {
            throw new BadRequestException('Stock cannot be negative');
        }

        const session = await this.connection.startSession();
        
        try {
            let transformedItem: TransformedItem;
            
            await session.withTransaction(async () => {
                const item = await this.inventoryModel.findById(itemId).session(session);
                if (!item) {
                    throw new NotFoundException('Item not found');
                }

                const previousQuantity = item.quantity;
                const difference = newStock - previousQuantity;

                if (difference === 0) {
                    transformedItem = this.transformItem(item);
                    return;
                }

                item.quantity = newStock;
                item.lastModifiedBy = userId as any;

                if (difference > 0) {
                    item.totalStockIn = (item.totalStockIn || 0) + difference;
                    item.lastRestockDate = new Date();
                } else {
                    item.totalStockOut = (item.totalStockOut || 0) + Math.abs(difference);
                }

                const historyEntry: StockHistoryEntry = {
                    action: difference > 0 ? 'IN' : 'OUT',
                    quantity: Math.abs(difference),
                    previousQuantity,
                    newQuantity: newStock,
                    userId: userId as any,
                    reason: 'quick_update',
                    notes: `Quick update from ${previousQuantity} to ${newStock}`,
                    timestamp: new Date(),
                };
                
                item.recentHistory = [historyEntry, ...(item.recentHistory || [])].slice(0, 50);
                
                await item.save({ session });

                // Create movement record
                const movement = new this.stockModel({
                    itemId,
                    userId,
                    type: difference > 0 ? 'IN' : 'OUT',
                    quantity: Math.abs(difference),
                    reason: 'quick_update',
                    notes: `Stock adjusted from ${previousQuantity} to ${newStock}`,
                    previousQuantity,
                    newQuantity: newStock,
                });
                await movement.save({ session });

                transformedItem = this.transformItem(item);
            });

            return transformedItem!;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Get movements with advanced filtering and pagination
     */
    async getMovements(filters: MovementFilters = {}) {
        const { itemId, userId, type, reason, startDate, endDate, limit = 50, page = 1 } = filters;
        
        const query: any = {};
        
        if (itemId) query.itemId = itemId;
        if (userId) query.userId = userId;
        if (type) query.type = type;
        if (reason) query.reason = reason;
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = startDate;
            if (endDate) query.createdAt.$lte = endDate;
        }

        const skip = (page - 1) * limit;
        
        const [movements, total] = await Promise.all([
            this.stockModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('itemId', 'name sku category')
                .populate('userId', 'name email')
                .exec(),
            this.stockModel.countDocuments(query),
        ]);

        return {
            data: movements,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get item history (from embedded recent history + movement collection)
     */
    async getItemHistory(itemId: string, limit = 100) {
        const item = await this.inventoryModel.findById(itemId).select('recentHistory').exec();
        if (!item) {
            throw new NotFoundException('Item not found');
        }

        // Get more from movement collection if needed
        const movements = await this.stockModel
            .find({ itemId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('userId', 'name email')
            .exec();

        return {
            recentHistory: item.recentHistory || [],
            movements,
        };
    }

    /**
     * Bulk stock operations with single transaction
     */
    async bulkAddStock(operations: StockOperationInput[]): Promise<StockOperationResult[]> {
        const session = await this.connection.startSession();
        
        try {
            const results: StockOperationResult[] = [];
            
            await session.withTransaction(async () => {
                for (const op of operations) {
                    const item = await this.inventoryModel.findById(op.itemId).session(session);
                    if (!item) {
                        throw new NotFoundException(`Item not found: ${op.itemId}`);
                    }

                    const previousQuantity = item.quantity;
                    const newQuantity = previousQuantity + op.quantity;

                    item.quantity = newQuantity;
                    item.totalStockIn = (item.totalStockIn || 0) + op.quantity;
                    item.lastRestockDate = new Date();
                    item.lastModifiedBy = op.userId as any;

                    const historyEntry: StockHistoryEntry = {
                        action: 'IN',
                        quantity: op.quantity,
                        previousQuantity,
                        newQuantity,
                        userId: op.userId as any,
                        reason: op.reason,
                        notes: op.notes || '',
                        timestamp: new Date(),
                    };
                    
                    item.recentHistory = [historyEntry, ...(item.recentHistory || [])].slice(0, 50);
                    
                    await item.save({ session });

                    const movement = new this.stockModel({
                        itemId: op.itemId,
                        userId: op.userId,
                        type: 'IN',
                        quantity: op.quantity,
                        reason: op.reason,
                        notes: op.notes || '',
                        previousQuantity,
                        newQuantity,
                        referenceNumber: op.referenceNumber,
                        metadata: op.metadata,
                    });
                    await movement.save({ session });

                    results.push({
                        movement,
                        item: this.transformItem(item),
                        previousQuantity,
                        newQuantity,
                    });
                }
            });

            return results;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Get stock statistics for an item
     */
    async getItemStats(itemId: string) {
        const item = await this.inventoryModel.findById(itemId).exec();
        if (!item) {
            throw new NotFoundException('Item not found');
        }

        // Get movement stats
        const [inStats, outStats] = await Promise.all([
            this.stockModel.aggregate([
                { $match: { itemId: item._id, type: 'IN' } },
                { $group: { _id: null, total: { $sum: '$quantity' }, count: { $sum: 1 } } },
            ]),
            this.stockModel.aggregate([
                { $match: { itemId: item._id, type: 'OUT' } },
                { $group: { _id: null, total: { $sum: '$quantity' }, count: { $sum: 1 } } },
            ]),
        ]);

        // Get last 30 days activity
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivity = await this.stockModel.aggregate([
            { 
                $match: { 
                    itemId: item._id, 
                    createdAt: { $gte: thirtyDaysAgo } 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
                    totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return {
            currentStock: item.quantity,
            totalStockIn: inStats[0]?.total || 0,
            totalStockOut: outStats[0]?.total || 0,
            inTransactions: inStats[0]?.count || 0,
            outTransactions: outStats[0]?.count || 0,
            averageDailyUsage: (outStats[0]?.total || 0) / 30,
            daysUntilStockout: item.quantity > 0 
                ? Math.floor(item.quantity / ((outStats[0]?.total || 1) / 30))
                : 0,
            recentActivity,
            lastRestockDate: item.lastRestockDate,
            lastSaleDate: item.lastSaleDate,
        };
    }

    // Transform backend item to frontend format
    private transformItem(item: InventoryDocument): TransformedItem {
        const obj = item.toObject();
        return {
            _id: obj._id.toString(),
            name: obj.name,
            description: obj.description || '',
            stock: obj.quantity,
            category: obj.category || 'General',
            lowStockThreshold: obj.lowStockThreshold || 5,
            sku: obj.sku,
            unitPrice: obj.unitPrice,
            isLowStock: obj.quantity <= (obj.lowStockThreshold || 5),
            totalStockIn: obj.totalStockIn || 0,
            totalStockOut: obj.totalStockOut || 0,
            lastRestockDate: obj.lastRestockDate,
            lastSaleDate: obj.lastSaleDate,
        };
    }
}
