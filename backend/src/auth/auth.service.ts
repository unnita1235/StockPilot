import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
    ) { }

    async register(email: string, password: string, name: string) {
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
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
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.generateToken(user);
        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    async validateUser(userId: string): Promise<UserDocument | null> {
        return this.userModel.findById(userId).select('-password').exec();
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
