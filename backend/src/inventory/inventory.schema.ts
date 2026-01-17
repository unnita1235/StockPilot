import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
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