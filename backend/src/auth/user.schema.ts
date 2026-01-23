import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

// User roles enum
export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    STAFF = 'staff',
    VIEWER = 'viewer',
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
    [UserRole.ADMIN]: [
        'create_item', 'read_item', 'update_item', 'delete_item',
        'add_stock', 'remove_stock', 'view_reports', 'manage_users',
        'manage_settings', 'view_analytics', 'export_data'
    ],
    [UserRole.MANAGER]: [
        'create_item', 'read_item', 'update_item',
        'add_stock', 'remove_stock', 'view_reports', 'view_analytics', 'export_data'
    ],
    [UserRole.STAFF]: [
        'read_item', 'update_item', 'add_stock', 'remove_stock'
    ],
    [UserRole.VIEWER]: [
        'read_item'
    ],
} as const;

@Schema({ timestamps: true })
export class User {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })
    tenantId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ type: String, enum: UserRole, default: UserRole.STAFF })
    role: UserRole;

    @Prop()
    resetPasswordToken?: string;

    @Prop()
    resetPasswordExpires?: Date;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for tenant-scoped user queries
UserSchema.index({ tenantId: 1, email: 1 });
