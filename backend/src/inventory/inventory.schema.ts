import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    quantity: number;

    @Prop()
    location: string;

    @Prop()
    threshold: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
