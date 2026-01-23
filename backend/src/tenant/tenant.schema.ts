import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

export interface TenantSettings {
    timezone: string;
    currency: string;
    dateFormat: string;
    lowStockAlertEmail: string;
    features: {
        aiForecasting: boolean;
        multiWarehouse: boolean;
        advancedReporting: boolean;
    };
}

@Schema({ timestamps: true })
export class Tenant {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true, unique: true })
    slug: string;

    @Prop({ required: true, unique: true })
    domain: string;

    @Prop({ required: true })
    contactEmail: string;

    @Prop()
    contactPhone: string;

    @Prop()
    address: string;

    @Prop({ type: Object, default: {} })
    settings: TenantSettings;

    @Prop({ default: 'active' })
    status: 'active' | 'suspended' | 'inactive';

    @Prop({ default: 'free' })
    plan: 'free' | 'starter' | 'professional' | 'enterprise';

    @Prop()
    subscriptionExpiresAt: Date;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

// Additional indexes (slug and domain already have unique indexes from @Prop)
TenantSchema.index({ status: 1 });
