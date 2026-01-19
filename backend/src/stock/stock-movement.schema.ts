import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class StockMovement extends Document {
  @Prop({ required: true })
  stockId: string;

  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true, enum: ['IN', 'OUT'] })
  type: 'IN' | 'OUT';

  @Prop({ required: true })
  quantity: number;

  @Prop()
  reason?: string;
}

export const StockMovementSchema =
  SchemaFactory.createForClass(StockMovement);