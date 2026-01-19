import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
    tenantId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ required: true, default: 0 })
    quantity: number;

    @Prop({ default: 'General' })
    category: string;

    @Prop()
    location: string;

    @Prop({ default: 5 }) // Renamed from 'threshold' to match frontend
    lowStockThreshold: number;

    @Prop({ default: 0 })
    unitPrice: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// Compound index for tenant-scoped queries
InventorySchema.index({ tenantId: 1, category: 1 });
InventorySchema.index({ tenantId: 1, name: 1 });