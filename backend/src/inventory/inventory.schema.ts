import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InventoryDocument = Inventory & Document;

// Embedded schema for tracking stock history directly on item
@Schema({ _id: false })
export class StockHistoryEntry {
    @Prop({ required: true, enum: ['IN', 'OUT', 'ADJUST', 'TRANSFER'] })
    action: string;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    previousQuantity: number;

    @Prop({ required: true })
    newQuantity: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    reason: string;

    @Prop()
    notes: string;

    @Prop({ required: true, default: () => new Date() })
    timestamp: Date;
}

export const StockHistoryEntrySchema = SchemaFactory.createForClass(StockHistoryEntry);

// Embedded schema for batch tracking
@Schema({ _id: false })
export class BatchInfo {
    @Prop({ required: true })
    lotNumber: string;

    @Prop()
    manufacturingDate: Date;

    @Prop()
    expiryDate: Date;

    @Prop({ default: 0 })
    quantity: number;

    @Prop()
    supplier: string;

    @Prop()
    costPerUnit: number;

    @Prop({ default: 'active', enum: ['active', 'expired', 'recalled', 'depleted'] })
    status: string;
}

export const BatchInfoSchema = SchemaFactory.createForClass(BatchInfo);

@Schema({ timestamps: true })
export class Inventory {
    @Prop({ required: true, index: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ required: true, default: 0, min: 0 })
    quantity: number;

    @Prop({ default: 'General', index: true })
    category: string;

    @Prop()
    location: string;

    @Prop({ default: 5 })
    lowStockThreshold: number;

    @Prop({ default: 0, min: 0 })
    unitPrice: number;

    @Prop({ unique: true, sparse: true })
    sku: string;

    @Prop()
    barcode: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    createdBy: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    lastModifiedBy: MongooseSchema.Types.ObjectId;

    // Embedded history for quick access to recent changes (last 50)
    @Prop({ type: [StockHistoryEntrySchema], default: [] })
    recentHistory: StockHistoryEntry[];

    // Stock statistics
    @Prop({ default: 0 })
    totalStockIn: number;

    @Prop({ default: 0 })
    totalStockOut: number;

    @Prop()
    lastRestockDate: Date;

    @Prop()
    lastSaleDate: Date;

    // Supplier reference
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier' })
    supplierId: MongooseSchema.Types.ObjectId;

    // Batch/Expiry tracking
    @Prop({ type: [BatchInfoSchema], default: [] })
    batches: BatchInfo[];

    @Prop()
    defaultExpiryDays: number;

    @Prop({ default: false })
    trackBatches: boolean;

    // Images
    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop()
    primaryImage: string;

    // Additional metadata
    @Prop()
    weight: number;

    @Prop()
    weightUnit: string;

    @Prop()
    dimensions: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ default: true })
    isActive: boolean;

    // Versioning for optimistic locking
    @Prop({ default: 0 })
    __v: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// Add text index for search
InventorySchema.index({ name: 'text', description: 'text', sku: 'text' });

// Add compound indexes
InventorySchema.index({ category: 1, quantity: 1 });
InventorySchema.index({ quantity: 1, lowStockThreshold: 1 });