import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type UserRole = 'admin' | 'manager' | 'viewer';

export const USER_ROLES: UserRole[] = ['admin', 'manager', 'viewer'];

export const ROLE_PERMISSIONS = {
    admin: ['read', 'write', 'delete', 'manage_users', 'export', 'settings'],
    manager: ['read', 'write', 'delete', 'export'],
    viewer: ['read'],
} as const;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: 'viewer', enum: USER_ROLES })
    role: UserRole;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastLoginAt: Date;

    @Prop()
    avatar: string;

    @Prop({ type: Object, default: {} })
    preferences: {
        emailNotifications?: boolean;
        smsNotifications?: boolean;
        lowStockAlerts?: boolean;
        theme?: 'light' | 'dark' | 'system';
    };
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for faster lookups
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
