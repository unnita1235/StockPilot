import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true, enum: AuditAction })
    action: string;

    @Prop({ required: true })
    entity: string;

    @Prop({ required: true })
    entityId: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    oldValue: any;

    @Prop({ type: MongooseSchema.Types.Mixed })
    newValue: any;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
