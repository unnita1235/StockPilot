import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum StockMovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    AUDIT = 'AUDIT',
}

export type StockMovementDocument = StockMovement & Document;

@Schema({ timestamps: true })
export class StockMovement {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
    tenantId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true, index: true })
    inventoryId: Types.ObjectId;

    @Prop({ required: true, enum: StockMovementType })
    type: StockMovementType;

    @Prop({ required: true })
    quantity: number; // Positive for IN, Negative for OUT usually, or just delta

    @Prop({ required: true })
    reason: string;

    @Prop()
    reference: string; // Optional: Order ID, Invoice ID, etc.
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
