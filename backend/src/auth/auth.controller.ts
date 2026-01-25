import { Controller, Post, Put, Body, Get, Delete, Param, UseGuards, Request, Res, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Response } from 'express';
import { UserRole } from './user.schema';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(
        @Body() body: RegisterDto,
        @Res() res: Response
    ) {
        const result = await this.authService.register(body.email, body.password, body.name);
        this.setCookie(res, result.token);
        return res.status(HttpStatus.CREATED).json({
            success: true,
            data: {
                user: result.user,
                token: result.token,
            },
            message: 'Registration successful'
        });
    }

    @Post('login')
    async login(
        @Body() body: LoginDto,
        @Res() res: Response
    ) {
        const result = await this.authService.login(body.email, body.password);
        this.setCookie(res, result.token);
        return res.status(HttpStatus.OK).json({
            success: true,
            data: {
                user: result.user,
                token: result.token,
            },
            message: 'Login successful'
        });
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Res() res: Response) {
        res.clearCookie('stockpilot_token');
        return res.status(HttpStatus.OK).json({ success: true, message: 'Logged out' });
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return { success: true, data: req.user };
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    async updateProfile(
        @Request() req,
        @Body() body: UpdateProfileDto,
        @Res() res: Response
    ) {
        const updatedUser = await this.authService.updateProfile(req.user._id || req.user.id, body);
        return res.status(HttpStatus.OK).json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully'
        });
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() body: ForgotPasswordDto) {
        const result = await this.authService.forgotPassword(body.email);
        return { success: true, ...result };
    }

    @Post('reset-password')
    async resetPassword(@Body() body: ResetPasswordDto) {
        await this.authService.resetPassword(body.token, body.newPassword);
        return { success: true, message: 'Password reset successful' };
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(
        @Request() req,
        @Body() body: ChangePasswordDto
    ) {
        await this.authService.changePassword(
            req.user._id || req.user.id,
            body.currentPassword,
            body.newPassword
        );
        return { success: true, message: 'Password changed successfully' };
    }

    // ============ Admin User Management ============

    @Get('users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async getAllUsers() {
        const users = await this.authService.getAllUsers();
        return { success: true, data: users };
    }

    @Get('users/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async getUserById(@Param('id') id: string) {
        const user = await this.authService.getUserById(id);
        return { success: true, data: user };
    }

    @Put('users/:id/role')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async updateUserRole(
        @Param('id') id: string,
        @Body() body: { role: UserRole }
    ) {
        const user = await this.authService.updateUserRole(id, body.role);
        return { success: true, data: user, message: 'User role updated' };
    }

    @Put('users/:id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async setUserStatus(
        @Param('id') id: string,
        @Body() body: { isActive: boolean }
    ) {
        const user = await this.authService.setUserActive(id, body.isActive);
        return { success: true, data: user, message: `User ${body.isActive ? 'activated' : 'deactivated'}` };
    }

    @Delete('users/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async deleteUser(@Param('id') id: string) {
        await this.authService.deleteUser(id);
        return { success: true, message: 'User deleted' };
    }

    private setCookie(res: Response, token: string) {
        res.cookie('stockpilot_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }
}