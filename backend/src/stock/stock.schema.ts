import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
export type MovementReason = 
    | 'purchase' 
    | 'sale' 
    | 'return' 
    | 'damaged' 
    | 'expired' 
    | 'theft' 
    | 'correction' 
    | 'transfer' 
    | 'initial_stock'
    | 'quick_update'
    | 'other';

@Schema({ timestamps: true })
export class StockMovement {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Inventory', required: true, index: true })
    itemId: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    userId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true, enum: ['IN', 'OUT', 'ADJUST', 'TRANSFER'] })
    type: MovementType;

    @Prop({ required: true, min: 0 })
    quantity: number;

    @Prop({ required: true })
    reason: MovementReason;

    @Prop()
    notes: string;

    @Prop({ required: true })
    previousQuantity: number;

    @Prop({ required: true })
    newQuantity: number;

    @Prop()
    referenceNumber: string; // For linking related transactions (e.g., purchase order)

    @Prop({ type: Object })
    metadata: Record<string, any>; // Flexible field for additional data
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);

// Add compound indexes for efficient queries
StockMovementSchema.index({ itemId: 1, createdAt: -1 });
StockMovementSchema.index({ userId: 1, createdAt: -1 });
StockMovementSchema.index({ type: 1, createdAt: -1 });
StockMovementSchema.index({ reason: 1, createdAt: -1 });
