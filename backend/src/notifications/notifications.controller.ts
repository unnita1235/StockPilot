import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.schema';
import { createResponse } from '../common/api-response';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('test')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async sendTestNotification(@Request() req, @Body() body: { message?: string }) {
        await this.notificationsService.sendNotification({
            userId: req.user.userId,
            type: 'info',
            title: 'Test Notification',
            message: body.message || 'This is a test notification from StockPilot',
        });
        return createResponse(null, 'Test notification sent');
    }

    @Post('test-email')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async sendTestEmail(@Body() body: { email: string }) {
        const success = await this.notificationsService.sendEmail({
            to: body.email,
            subject: 'StockPilot Test Email',
            body: 'This is a test email from StockPilot.',
            html: '<h1>Test Email</h1><p>This is a test email from StockPilot.</p>',
        });
        return createResponse({ success }, success ? 'Test email sent' : 'Failed to send test email');
    }
}
