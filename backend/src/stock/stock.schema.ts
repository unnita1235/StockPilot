import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

@Schema({ timestamps: true })
export class StockMovement {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
    tenantId: Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Inventory', required: true })
    itemId: string;

    @Prop({ required: true, enum: ['IN', 'OUT', 'ADJUST'] })
    type: 'IN' | 'OUT' | 'ADJUST';

    @Prop({ required: true, min: 0 })
    quantity: number;

    @Prop({ required: true })
    reason: string;

    @Prop()
    notes: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    userId: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);

// Indexes for efficient tenant-scoped queries
StockMovementSchema.index({ tenantId: 1, itemId: 1 });
StockMovementSchema.index({ tenantId: 1, createdAt: -1 });
