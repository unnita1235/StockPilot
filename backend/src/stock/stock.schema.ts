import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

@Schema({ timestamps: true })
export class StockMovement {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Inventory', required: true })
    itemId: string;

    @Prop({ required: true, enum: ['IN', 'OUT', 'ADJUST'] })
    type: string;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    reason: string;

    @Prop()
    notes: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
