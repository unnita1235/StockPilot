import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PositionDocument = Position & Document;

@Schema({ timestamps: true })
export class Position {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    userId: string;

    @Prop({ required: true, uppercase: true, trim: true })
    symbol: string;

    @Prop({ required: true, min: 0 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    buyPrice: number;
}

export const PositionSchema = SchemaFactory.createForClass(Position);

// Compound index to ensure a user only has one entry per symbol (optional, but good for aggregation)
// Actually, for simplicity, if a user adds the same stock again, we might want to aggregate it or treat it as a separate buy lot.
// For this MVP, let's treat them as separate lots or allow duplicates.
// But to keep "Updating a position" simple based on ID, we don't strictly need a unique index on symbol.
// If the requirement was "Average Down", we would merge.
// The user asked for "Adding a stock position", "Updating or deleting a position".
// I will support multiple distinct positions (lots).
