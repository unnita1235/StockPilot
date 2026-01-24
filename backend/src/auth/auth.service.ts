import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument, UserRole } from './user.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
    ) { }

    async register(email: string, password: string, name: string) {
        // CRITICAL: Check globally for email existence to prevent duplicate key errors
        // The tenant plugin filters findOne, so we must use the native collection
        const existingUserGlobal = await this.userModel.db.collection('users').findOne({ email });

        if (existingUserGlobal) {
            throw new ConflictException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new this.userModel({
            email,
            password: hashedPassword,
            name,
        });
        await user.save();

        const token = this.generateToken(user);
        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    async login(email: string, password: string) {
        // Use native collection to bypass tenant plugin for login lookup
        // We match by email globally, then validate password
        const userDoc = await this.userModel.db.collection('users').findOne({ email });

        if (!userDoc) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Hydrate to a Mongoose document to use methods/virtuals/types
        const user = this.userModel.hydrate(userDoc);

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        const token = this.generateToken(user);
        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    async validateUser(userId: string): Promise<UserDocument | null> {
        // Use native collection to bypass tenant plugin for token validation
        // We want to validate the user exists globally, even if accessing a different tenant context
        // (Data isolation will still be enforced by service/controller queries using TenantContext)
        try {
            const userDoc = await this.userModel.db.collection('users').findOne({
                _id: new Types.ObjectId(userId)
            });

            if (!userDoc) {
                return null;
            }

            // Hydrate and exclude password (though .select('-password') doesn't work on raw doc, we delete it manually)
            const user = this.userModel.hydrate(userDoc);
            const obj = user.toObject();
            delete obj.password;
            return user; // Return hydrated user
        } catch (error) {
            return null;
        }
    }

    async updateProfile(userId: string, updates: { name?: string }) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (updates.name) {
            user.name = updates.name;
        }

        await user.save();
        return this.sanitizeUser(user);
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
        if (!user) {
            // Don't reveal if user exists or not - always return same message
            return { message: 'If an account exists with this email, a reset link has been sent.' };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        // TODO: Send email with reset link in production
        // Example: await this.emailService.sendPasswordReset(user.email, resetToken);
        // Reset URL should be: ${FRONTEND_URL}/reset-password?token=${resetToken}

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV ONLY] Password reset token for ${email}: ${resetToken}`);
        }

        return { message: 'If an account exists with this email, a reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        }).exec();

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
    }

    // Admin: Get all users
    async getAllUsers(): Promise<UserDocument[]> {
        return this.userModel.find().select('-password -resetPasswordToken').exec();
    }

    // Admin: Get user by ID
    async getUserById(userId: string): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).select('-password -resetPasswordToken').exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    // Admin: Update user role
    async updateUserRole(userId: string, role: UserRole): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.role = role;
        await user.save();
        return this.sanitizeUser(user) as UserDocument;
    }

    // Admin: Activate/Deactivate user
    async setUserActive(userId: string, isActive: boolean): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.isActive = isActive;
        await user.save();
        return this.sanitizeUser(user) as UserDocument;
    }

    // Admin: Delete user
    async deleteUser(userId: string): Promise<void> {
        const result = await this.userModel.findByIdAndDelete(userId).exec();
        if (!result) {
            throw new NotFoundException('User not found');
        }
    }

    private generateToken(user: UserDocument) {
        const payload = { sub: user._id, email: user.email };
        return this.jwtService.sign(payload);
    }

    private sanitizeUser(user: UserDocument) {
        const obj = user.toObject();
        delete obj.password;
        return obj;
    }
}
