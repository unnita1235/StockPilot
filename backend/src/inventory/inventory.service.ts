import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
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
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(StockMovement.name) private stockMovementModel: Model<StockMovementDocument>,
        private auditService: AuditService,
    ) {}

    // Helper to get user ID - in a real app this would come from CLS/Request Context
    private getCurrentUserId(): string {
        return 'system-user'; // Placeholder
    }

    /**
     * Validate ObjectId format
     */
    private validateObjectId(id: string, fieldName: string = 'ID'): void {
        if (!id) {
            throw new BadRequestException(`${fieldName} is required`);
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(`Invalid ${fieldName} format`);
        }
    }

    /**
     * Validate numeric value for business logic
     */
    private validateNumericValue(
        value: number,
        fieldName: string,
        options: { min?: number; max?: number; allowZero?: boolean } = {},
    ): void {
        const { min = 0, max = Number.MAX_SAFE_INTEGER, allowZero = true } = options;

        if (value === null || value === undefined) {
            throw new BadRequestException(`${fieldName} is required`);
        }

        if (typeof value !== 'number' || isNaN(value)) {
            throw new BadRequestException(`${fieldName} must be a valid number`);
        }

        if (!isFinite(value)) {
            throw new BadRequestException(`${fieldName} must be a finite number`);
        }

        if (!allowZero && value === 0) {
            throw new BadRequestException(`${fieldName} cannot be zero`);
        }

        if (value < min) {
            throw new BadRequestException(`${fieldName} cannot be less than ${min}`);
        }

        if (value > max) {
            throw new BadRequestException(`${fieldName} cannot exceed ${max}`);
        }
    }

    /**
     * Find all inventory items with optional tenant filtering
     */
    async findAll(tenantId?: string | Types.ObjectId): Promise<InventoryDocument[]> {
        try {
            const filter: any = {};
            if (tenantId) {
                filter.tenantId = tenantId;
            }

            const items = await this.inventoryModel.find(filter).exec();
            this.logger.log(`Retrieved ${items.length} inventory items`);
            return items;
        } catch (error) {
            this.logger.error('Error retrieving inventory items:', error.message);
            throw new InternalServerErrorException('Failed to retrieve inventory items');
        }
    }

    /**
     * Find a single inventory item by ID with tenant filtering
     */
    async findOne(id: string, tenantId?: string | Types.ObjectId): Promise<InventoryDocument> {
        try {
            // Validate ID format
            this.validateObjectId(id, 'Inventory ID');

            const filter: any = { _id: id };
            if (tenantId) {
                filter.tenantId = tenantId;
            }

            const item = await this.inventoryModel.findOne(filter).exec();

            if (!item) {
                throw new NotFoundException(`Inventory item with ID '${id}' not found`);
            }

            return item;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error finding inventory item ${id}:`, error.message);
            throw new InternalServerErrorException('Failed to retrieve inventory item');
        }
    }

    /**
     * Create a new inventory item with validation and audit logging
     */
    async create(dto: Partial<Inventory>, tenantId?: string | Types.ObjectId): Promise<InventoryDocument> {
        try {
            // Validate input data
            if (!dto.name || dto.name.trim().length === 0) {
                throw new BadRequestException('Inventory name is required');
            }

            const data = { ...dto };

            // Validate and set tenantId
            if (tenantId) {
                if (typeof tenantId === 'string') {
                    this.validateObjectId(tenantId, 'Tenant ID');
                    data.tenantId = new Types.ObjectId(tenantId);
                } else {
                    data.tenantId = tenantId;
                }
            }

            // Validate quantity if provided
            const initialQuantity = data.quantity || 0;
            this.validateNumericValue(initialQuantity, 'Initial quantity', { min: 0, allowZero: true });

            // Validate other numeric fields
            if (data.unitPrice !== undefined) {
                this.validateNumericValue(data.unitPrice, 'Unit price', { min: 0, allowZero: true });
            }

            if (data.lowStockThreshold !== undefined) {
                this.validateNumericValue(data.lowStockThreshold, 'Low stock threshold', {
                    min: 0,
                    allowZero: true,
                });
            }

            // Set quantity to 0 initially, we will add it via movement
            data.quantity = 0;

            const newItem = new this.inventoryModel(data);
            const savedItem = await newItem.save();

            // Log audit trail
            await this.auditService.log({
                tenantId: savedItem.tenantId.toString(),
                userId: this.getCurrentUserId(),
                action: AuditAction.CREATE,
                entity: 'Inventory',
                entityId: savedItem._id.toString(),
                newValue: savedItem.toObject(),
            });

            this.logger.log(`Created inventory item: ${savedItem._id}`);

            // Create initial stock movement if quantity > 0
            if (initialQuantity > 0) {
                await this.createMovement(
                    savedItem._id.toString(),
                    {
                        type: StockMovementType.IN,
                        quantity: initialQuantity,
                        reason: 'Initial Inventory Creation',
                    },
                    tenantId,
                );

                // Re-fetch to get updated quantity
                const updatedItem = await this.inventoryModel.findById(savedItem._id).exec();
                if (!updatedItem) {
                    throw new InternalServerErrorException('Failed to retrieve created item');
                }
                return updatedItem;
            }

            return savedItem;
        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            this.logger.error('Error creating inventory item:', error.message);
            throw new InternalServerErrorException('Failed to create inventory item');
        }
    }

    /**
     * Update an inventory item with validation
     */
    async update(
        id: string,
        dto: Partial<Inventory>,
        tenantId?: string | Types.ObjectId,
    ): Promise<InventoryDocument> {
        try {
            // Validate ID
            this.validateObjectId(id, 'Inventory ID');

            const filter: any = { _id: id };
            if (tenantId) {
                filter.tenantId = tenantId;
            }

            // Validate update data
            if (dto.name !== undefined && dto.name.trim().length === 0) {
                throw new BadRequestException('Name cannot be empty');
            }

            // Prevent direct quantity updates - must use stock movements
            if ('quantity' in dto) {
                delete dto.quantity;
                this.logger.warn('Attempted direct quantity update blocked - use stock movements instead');
            }

            // Validate numeric fields if provided
            if (dto.unitPrice !== undefined) {
                this.validateNumericValue(dto.unitPrice, 'Unit price', { min: 0, allowZero: true });
            }

            if (dto.lowStockThreshold !== undefined) {
                this.validateNumericValue(dto.lowStockThreshold, 'Low stock threshold', {
                    min: 0,
                    allowZero: true,
                });
            }

            // Check if item exists
            const oldItem = await this.inventoryModel.findOne(filter).exec();
            if (!oldItem) {
                throw new NotFoundException(`Inventory item with ID '${id}' not found`);
            }

            // Update the item
            const item = await this.inventoryModel.findOneAndUpdate(filter, dto, { new: true }).exec();

            if (!item) {
                throw new InternalServerErrorException('Failed to update inventory item');
            }

            // Log audit trail
            await this.auditService.log({
                tenantId: item.tenantId.toString(),
                userId: this.getCurrentUserId(),
                action: AuditAction.UPDATE,
                entity: 'Inventory',
                entityId: item._id.toString(),
                oldValue: oldItem.toObject(),
                newValue: item.toObject(),
            });

            this.logger.log(`Updated inventory item: ${item._id}`);

            return item;
        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            this.logger.error(`Error updating inventory item ${id}:`, error.message);
            throw new InternalServerErrorException('Failed to update inventory item');
        }
    }

    /**
     * Create a stock movement with comprehensive validation
     */
    async createMovement(
        inventoryId: string,
        dto: CreateStockMovementDto,
        tenantId?: string | Types.ObjectId,
    ): Promise<StockMovementDocument> {
        try {
            // Validate inventory ID
            this.validateObjectId(inventoryId, 'Inventory ID');

            // Validate quantity
            this.validateNumericValue(dto.quantity, 'Quantity', {
                min: -1000000000,
                max: 1000000000,
                allowZero: false,
            });

            // Validate movement type
            if (!Object.values(StockMovementType).includes(dto.type)) {
                throw new BadRequestException(
                    `Invalid movement type. Must be one of: ${Object.values(StockMovementType).join(', ')}`,
                );
            }

            // Validate reason
            if (!dto.reason || dto.reason.trim().length === 0) {
                throw new BadRequestException('Movement reason is required');
            }

            // Find the inventory item
            const item = await this.findOne(inventoryId, tenantId);

            // Calculate quantity change based on movement type
            let quantityChange = dto.quantity;

            if (dto.type === StockMovementType.IN) {
                // IN movements always add to inventory (ensure positive)
                quantityChange = Math.abs(dto.quantity);
            } else if (dto.type === StockMovementType.OUT) {
                // OUT movements always subtract from inventory (ensure negative)
                quantityChange = -Math.abs(dto.quantity);

                // Validate we don't go negative
                const newQuantity = item.quantity + quantityChange;
                if (newQuantity < 0) {
                    throw new BadRequestException(
                        `Insufficient stock. Current quantity: ${item.quantity}, requested: ${Math.abs(
                            quantityChange,
                        )}`,
                    );
                }
            }
            // For ADJUSTMENT and AUDIT types, respect the sign passed

            // Create the movement record
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
                { new: true },
            );

            if (!updatedItem) {
                throw new InternalServerErrorException('Failed to update inventory quantity');
            }

            this.logger.log(
                `Created ${dto.type} movement for inventory ${inventoryId}: ${quantityChange} units (new total: ${updatedItem.quantity})`,
            );

            return movement;
        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            this.logger.error(`Error creating movement for inventory ${inventoryId}:`, error.message);
            throw new InternalServerErrorException('Failed to create stock movement');
        }
    }

    /**
     * Remove an inventory item with validation
     */
    async remove(id: string, tenantId?: string | Types.ObjectId): Promise<void> {
        try {
            // Validate ID
            this.validateObjectId(id, 'Inventory ID');

            const filter: any = { _id: id };
            if (tenantId) {
                filter.tenantId = tenantId;
            }

            // Check if item exists
            const item = await this.inventoryModel.findOne(filter).exec();
            if (!item) {
                throw new NotFoundException(`Inventory item with ID '${id}' not found`);
            }

            // Delete the item
            await this.inventoryModel.deleteOne(filter).exec();

            // Log audit trail
            await this.auditService.log({
                tenantId: item.tenantId.toString(),
                userId: this.getCurrentUserId(),
                action: AuditAction.DELETE,
                entity: 'Inventory',
                entityId: item._id.toString(),
                oldValue: item.toObject(),
            });

            this.logger.log(`Deleted inventory item: ${item._id}`);
        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            this.logger.error(`Error deleting inventory item ${id}:`, error.message);
            throw new InternalServerErrorException('Failed to delete inventory item');
        }
    }

    /**
     * Get low stock items with optional tenant filtering
     */
    async getLowStockItems(tenantId?: string | Types.ObjectId): Promise<InventoryDocument[]> {
        try {
            const filter: any = {
                $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
            };

            if (tenantId) {
                filter.tenantId = tenantId;
            }

            const items = await this.inventoryModel.find(filter).exec();
            this.logger.log(`Found ${items.length} low stock items`);
            return items;
        } catch (error) {
            this.logger.error('Error retrieving low stock items:', error.message);
            throw new InternalServerErrorException('Failed to retrieve low stock items');
        }
    }

    /**
     * Calculate inventory forecast with comprehensive validation and error handling
     */
    async getForecast(inventoryId: string): Promise<ForecastResultDto> {
        try {
            // Validate inventory ID
            this.validateObjectId(inventoryId, 'Inventory ID');

            // Find the inventory item
            const item = await this.inventoryModel.findById(inventoryId).exec();
            if (!item) {
                throw new NotFoundException(`Inventory item with ID '${inventoryId}' not found`);
            }

            // Validate item quantity
            if (item.quantity === null || item.quantity === undefined) {
                throw new BadRequestException('Item quantity is not set');
            }

            this.validateNumericValue(item.quantity, 'Item quantity', { min: 0, allowZero: true });

            // Calculate Average Daily Consumption (ADC) - Look back 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const movements = await this.stockMovementModel
                .find({
                    inventoryId: item._id,
                    type: StockMovementType.OUT,
                    createdAt: { $gte: thirtyDaysAgo },
                })
                .exec();

            let totalOut = 0;
            movements.forEach((m) => {
                const qty = Math.abs(m.quantity);
                if (isFinite(qty) && !isNaN(qty)) {
                    totalOut += qty;
                }
            });

            // Guard against invalid totalOut
            if (!isFinite(totalOut) || isNaN(totalOut)) {
                this.logger.warn(`Invalid totalOut calculated for item ${inventoryId}, defaulting to 0`);
                totalOut = 0;
            }

            // Calculate average daily consumption
            // Use 30 days for average to smooth out spikes
            const adc = totalOut / 30;

            // Guard against invalid ADC
            if (!isFinite(adc) || isNaN(adc) || adc < 0) {
                this.logger.warn(`Invalid ADC calculated for item ${inventoryId}, defaulting to 0`);
                return this.createSafeForecast(0);
            }

            // Calculate Expected Stock-out Date
            let daysUntilStockout: number | null = null;
            let stockOutDate: Date | null = null;

            // CRITICAL: Guard against division by zero
            if (adc > 0 && isFinite(adc)) {
                daysUntilStockout = item.quantity / adc;

                // Validate daysUntilStockout
                if (!isFinite(daysUntilStockout) || isNaN(daysUntilStockout) || daysUntilStockout < 0) {
                    this.logger.warn(
                        `Invalid daysUntilStockout calculated for item ${inventoryId}, setting to null`,
                    );
                    daysUntilStockout = null;
                } else {
                    stockOutDate = new Date();
                    stockOutDate.setDate(stockOutDate.getDate() + Math.floor(daysUntilStockout));
                }
            }

            // Calculate Recommended Reorder Quantity
            // Policy: Keep 30 days of stock (targetDays) + 7 days LeadTime
            const targetDays = 30;
            const leadTime = 7;
            const targetStock = adc * (targetDays + leadTime);

            // Guard against invalid targetStock
            if (!isFinite(targetStock) || isNaN(targetStock)) {
                this.logger.warn(`Invalid targetStock calculated for item ${inventoryId}, defaulting to 0`);
                return this.createSafeForecast(adc);
            }

            let reorderQuantity = targetStock - item.quantity;
            if (reorderQuantity < 0 || !isFinite(reorderQuantity) || isNaN(reorderQuantity)) {
                reorderQuantity = 0;
            }

            // Determine Status
            let status: 'Safe' | 'Low' | 'Critical' = 'Safe';
            if (daysUntilStockout !== null && isFinite(daysUntilStockout)) {
                if (daysUntilStockout < leadTime) {
                    status = 'Critical';
                } else if (daysUntilStockout < leadTime + 5) {
                    status = 'Low';
                }
            }

            const forecast: ForecastResultDto = {
                stockOutDate,
                reorderQuantity: Math.ceil(reorderQuantity), // Round up for safety
                dailyUsage: parseFloat(adc.toFixed(2)),
                daysUntilStockout: daysUntilStockout !== null ? Math.floor(daysUntilStockout) : null,
                status,
            };

            this.logger.log(
                `Calculated forecast for item ${inventoryId}: ${status} - ${daysUntilStockout} days until stockout`,
            );

            return forecast;
        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            this.logger.error(`Error calculating forecast for inventory ${inventoryId}:`, error.message);
            throw new InternalServerErrorException('Failed to calculate inventory forecast');
        }
    }

    /**
     * Create a safe default forecast when calculations fail
     */
    private createSafeForecast(dailyUsage: number = 0): ForecastResultDto {
        return {
            stockOutDate: null,
            reorderQuantity: 0,
            dailyUsage: parseFloat(dailyUsage.toFixed(2)),
            daysUntilStockout: null,
            status: 'Safe',
        };
    }
}
