import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { Resend } from 'resend';

export interface NotificationPayload {
    userId?: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
}

export interface EmailPayload {
    to: string | string[];
    subject: string;
    body: string;
    html?: string;
}

export interface SmsPayload {
    to: string;
    message: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
    private logger = new Logger('NotificationsService');
    private resend: Resend | null = null;
    private fromEmail = 'StockPilot <notifications@stockpilot.com>';

    constructor(private readonly wsGateway: WebsocketGateway) { }

    onModuleInit() {
        if (process.env.RESEND_API_KEY) {
            this.resend = new Resend(process.env.RESEND_API_KEY);
            this.logger.log('Resend email service initialized');
        } else {
            this.logger.warn('RESEND_API_KEY not set - email notifications disabled');
        }
    }

    /**
     * Send real-time notification via WebSocket
     */
    async sendNotification(payload: NotificationPayload): Promise<void> {
        const notification = {
            id: `notif_${Date.now()}`,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            timestamp: new Date().toISOString(),
            read: false,
            data: payload.data,
        };

        this.wsGateway.broadcastNotification(notification, payload.userId);
        this.logger.debug(`Notification sent: ${payload.title}`);
    }

    /**
     * Send low stock alert (WebSocket + optional email)
     */
    async sendLowStockAlert(item: {
        _id: string;
        name: string;
        quantity: number;
        lowStockThreshold: number;
    }, alertEmail?: string): Promise<void> {
        const severity: 'critical' | 'warning' | 'info' = item.quantity === 0 ? 'critical' : 
                        item.quantity <= item.lowStockThreshold / 2 ? 'critical' : 'warning';

        const alertEvent = {
            type: item.quantity === 0 ? 'out_of_stock' as const : 'low_stock' as const,
            severity,
            itemId: item._id.toString(),
            itemName: item.name,
            currentStock: item.quantity,
            threshold: item.lowStockThreshold,
            message: item.quantity === 0 
                ? `${item.name} is out of stock!`
                : `${item.name} is running low (${item.quantity} remaining)`,
            timestamp: new Date().toISOString(),
        };

        // Broadcast via WebSocket
        this.wsGateway.broadcastAlert(alertEvent);

        // Also send as in-app notification
        await this.sendNotification({
            type: severity === 'critical' ? 'error' : 'warning',
            title: item.quantity === 0 ? 'Out of Stock!' : 'Low Stock Alert',
            message: alertEvent.message,
            data: { itemId: item._id, currentStock: item.quantity },
        });

        // Send email for critical alerts
        if (severity === 'critical' && alertEmail) {
            await this.sendLowStockEmailAlert(item, alertEmail);
        }
    }

    /**
     * Send immediate email alert for critical low stock
     */
    async sendLowStockEmailAlert(item: {
        _id: string;
        name: string;
        quantity: number;
        lowStockThreshold: number;
    }, email: string): Promise<boolean> {
        const isCritical = item.quantity === 0;
        const subject = isCritical 
            ? `🚨 URGENT: ${item.name} is OUT OF STOCK`
            : `⚠️ Low Stock Alert: ${item.name}`;

        return this.sendEmail({
            to: email,
            subject,
            body: `${item.name} requires immediate attention. Current stock: ${item.quantity} units (threshold: ${item.lowStockThreshold})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: ${isCritical ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">${isCritical ? '🚨 OUT OF STOCK' : '⚠️ LOW STOCK ALERT'}</h1>
                    </div>
                    <div style="padding: 20px; background: #f9fafb;">
                        <h2 style="color: #111827;">${item.name}</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Current Stock:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: ${isCritical ? '#dc2626' : '#f59e0b'}; font-weight: bold;">${item.quantity} units</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Threshold:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.lowStockThreshold} units</td>
                            </tr>
                        </table>
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'https://stock-pilot-wheat.vercel.app'}/inventory/${item._id}" 
                               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                View Item Details
                            </a>
                        </div>
                    </div>
                    <div style="padding: 15px; background: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
                        This is an automated alert from StockPilot Inventory Management
                    </div>
                </div>
            `,
        });
    }

    /**
     * Send stock update notification
     */
    async sendStockUpdateNotification(data: {
        type: 'stock_added' | 'stock_removed' | 'stock_adjusted' | 'item_created' | 'item_deleted';
        itemId: string;
        itemName: string;
        previousQuantity?: number;
        newQuantity?: number;
        userId: string;
        userName?: string;
    }): Promise<void> {
        const event = {
            ...data,
            timestamp: new Date().toISOString(),
        };

        this.wsGateway.broadcastStockUpdate(event);
    }

    /**
     * Send email notification via Resend
     */
    async sendEmail(payload: EmailPayload): Promise<boolean> {
        const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
        
        if (!this.resend) {
            this.logger.warn(`Email not sent (Resend not configured): ${payload.subject} to ${recipients.join(', ')}`);
            return false;
        }

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: recipients,
                subject: payload.subject,
                html: payload.html || `<p>${payload.body}</p>`,
                text: payload.body,
            });

            if (error) {
                this.logger.error(`Failed to send email: ${JSON.stringify(error)}`);
                return false;
            }

            this.logger.log(`Email sent successfully to ${recipients.join(', ')} (ID: ${data?.id})`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email: ${error}`);
            return false;
        }
    }

    /**
     * Send SMS notification (placeholder - integrate with Twilio)
     */
    async sendSms(payload: SmsPayload): Promise<boolean> {
        // TODO: Integrate with SMS service (Twilio, etc.)
        // Example with Twilio:
        // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        // await client.messages.create({
        //     body: payload.message,
        //     from: process.env.TWILIO_PHONE,
        //     to: payload.to,
        // });

        this.logger.log(`SMS would be sent to ${payload.to}: ${payload.message}`);
        
        if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
            try {
                // Actual SMS sending would go here
                this.logger.log(`SMS sent to ${payload.to}`);
                return true;
            } catch (error) {
                this.logger.error(`Failed to send SMS: ${error}`);
                return false;
            }
        }
        
        return true; // Return true for dev mode
    }

    /**
     * Send daily low stock summary
     */
    async sendDailyLowStockSummary(adminEmail: string, items: any[]): Promise<void> {
        if (items.length === 0) return;

        const itemsList = items
            .map(item => `- ${item.name}: ${item.quantity} units (threshold: ${item.lowStockThreshold})`)
            .join('\n');

        await this.sendEmail({
            to: adminEmail,
            subject: `StockPilot: ${items.length} items need attention`,
            body: `The following items are running low on stock:\n\n${itemsList}\n\nPlease review and restock as needed.`,
            html: `
                <h2>Low Stock Alert Summary</h2>
                <p>The following ${items.length} items need your attention:</p>
                <ul>
                    ${items.map(item => `
                        <li>
                            <strong>${item.name}</strong>: ${item.quantity} units 
                            (threshold: ${item.lowStockThreshold})
                        </li>
                    `).join('')}
                </ul>
                <p><a href="${process.env.FRONTEND_URL}/dashboard">View Dashboard</a></p>
            `,
        });
    }
}
