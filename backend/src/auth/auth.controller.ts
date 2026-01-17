import { Controller, Post, Body, Get, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express';
import { createResponse } from '../common/api-response';

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
        // Return wrapped response with token for frontend compatibility
        return res.status(HttpStatus.CREATED).json(createResponse({
            user: result.user,
            token: result.token,
        }, 'Registration successful'));
    }

    @Post('login')
    async login(
        @Body() body: { email: string; password: string },
        @Res() res: Response
    ) {
        const result = await this.authService.login(body.email, body.password);
        this.setCookie(res, result.token);
        // Return wrapped response with token for frontend compatibility
        return res.status(HttpStatus.OK).json(createResponse({
            user: result.user,
            token: result.token,
        }, 'Login successful'));
    }

    @Post('logout')
    async logout(@Res() res: Response) {
        res.clearCookie('stockpilot_token');
        return res.status(HttpStatus.OK).json(createResponse(null, 'Logged out'));
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return createResponse({ user: req.user });
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