import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ required: true, unique: true })
    code: string;

    @Prop()
    email: string;

    @Prop()
    phone: string;

    @Prop({ type: Object })
    address: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    };

    @Prop()
    contactPerson: string;

    @Prop()
    website: string;

    @Prop({ default: 'active', enum: ['active', 'inactive', 'pending'] })
    status: string;

    @Prop({ default: 0, min: 0, max: 5 })
    rating: number;

    @Prop({ default: 7 })
    leadTimeDays: number;

    @Prop({ default: 0 })
    minimumOrderValue: number;

    @Prop({ type: [String], default: [] })
    categories: string[];

    @Prop()
    notes: string;

    @Prop({ type: Object, default: {} })
    paymentTerms: {
        method?: string;
        netDays?: number;
        currency?: string;
    };
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

// Text index for search
SupplierSchema.index({ name: 'text', code: 'text', contactPerson: 'text' });
