import { Controller, Post, Put, Body, Get, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(
        @Body() body: { email: string; password: string; name: string },
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
        @Body() body: { email: string; password: string },
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
    async logout(@Res() res: Response) {
        res.clearCookie('stockpilot_token');
        return res.status(HttpStatus.OK).json({ message: 'Logged out' });
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return { success: true, data: { user: req.user } };
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    async updateProfile(
        @Request() req,
        @Body() body: { name?: string },
        @Res() res: Response
    ) {
        const updatedUser = await this.authService.updateProfile(req.user._id || req.user.id, body);
        return res.status(HttpStatus.OK).json({
            success: true,
            data: { user: updatedUser },
            message: 'Profile updated successfully'
        });
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