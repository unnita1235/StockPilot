import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from '../websocket/websocket.gateway';

export interface NotificationPayload {
    userId?: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
}

export interface EmailPayload {
    to: string;
    subject: string;
    body: string;
    html?: string;
}

export interface SmsPayload {
    to: string;
    message: string;
}

@Injectable()
export class NotificationsService {
    private logger = new Logger('NotificationsService');

    constructor(private readonly wsGateway: WebsocketGateway) { }

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
     * Send low stock alert
     */
    async sendLowStockAlert(item: {
        _id: string;
        name: string;
        quantity: number;
        lowStockThreshold: number;
    }): Promise<void> {
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

        this.wsGateway.broadcastAlert(alertEvent);

        // Also send as notification
        await this.sendNotification({
            type: severity === 'critical' ? 'error' : 'warning',
            title: item.quantity === 0 ? 'Out of Stock!' : 'Low Stock Alert',
            message: alertEvent.message,
            data: { itemId: item._id, currentStock: item.quantity },
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
     * Send email notification (placeholder - integrate with Resend/SendGrid)
     */
    async sendEmail(payload: EmailPayload): Promise<boolean> {
        // TODO: Integrate with email service (Resend, SendGrid, etc.)
        // Example with Resend:
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //     from: 'StockPilot <notifications@stockpilot.com>',
        //     to: payload.to,
        //     subject: payload.subject,
        //     html: payload.html || payload.body,
        // });

        this.logger.log(`Email would be sent to ${payload.to}: ${payload.subject}`);
        
        // For now, just log
        if (process.env.RESEND_API_KEY) {
            try {
                // Actual email sending would go here
                this.logger.log(`Email sent to ${payload.to}`);
                return true;
            } catch (error) {
                this.logger.error(`Failed to send email: ${error}`);
                return false;
            }
        }
        
        return true; // Return true for dev mode
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
