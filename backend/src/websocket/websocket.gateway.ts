import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface StockUpdateEvent {
    type: 'stock_added' | 'stock_removed' | 'stock_adjusted' | 'item_created' | 'item_deleted';
    itemId: string;
    itemName: string;
    previousQuantity?: number;
    newQuantity?: number;
    userId: string;
    userName?: string;
    timestamp: string;
}

export interface AlertEvent {
    type: 'low_stock' | 'out_of_stock' | 'restock_needed';
    severity: 'info' | 'warning' | 'critical';
    itemId: string;
    itemName: string;
    currentStock: number;
    threshold: number;
    message: string;
    timestamp: string;
}

export interface NotificationEvent {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/ws',
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('WebSocketGateway');
    private connectedClients = new Map<string, { userId?: string; role?: string }>();

    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        this.connectedClients.set(client.id, {});
        
        // Send connection confirmation
        client.emit('connected', { 
            message: 'Connected to StockPilot real-time updates',
            clientId: client.id,
        });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    @SubscribeMessage('authenticate')
    handleAuthenticate(client: Socket, payload: { userId: string; role: string }) {
        this.connectedClients.set(client.id, {
            userId: payload.userId,
            role: payload.role,
        });
        
        // Join role-based room
        client.join(`role:${payload.role}`);
        client.join(`user:${payload.userId}`);
        
        this.logger.log(`Client ${client.id} authenticated as ${payload.userId} (${payload.role})`);
        
        return { success: true, message: 'Authenticated successfully' };
    }

    @SubscribeMessage('subscribe_item')
    handleSubscribeItem(client: Socket, itemId: string) {
        client.join(`item:${itemId}`);
        return { success: true, message: `Subscribed to item ${itemId}` };
    }

    @SubscribeMessage('unsubscribe_item')
    handleUnsubscribeItem(client: Socket, itemId: string) {
        client.leave(`item:${itemId}`);
        return { success: true, message: `Unsubscribed from item ${itemId}` };
    }

    // Methods to broadcast events
    broadcastStockUpdate(event: StockUpdateEvent) {
        this.server.emit('stock_update', event);
        this.server.to(`item:${event.itemId}`).emit('item_stock_update', event);
        this.logger.debug(`Stock update broadcast: ${event.type} for ${event.itemName}`);
    }

    broadcastAlert(event: AlertEvent) {
        this.server.emit('alert', event);
        
        // Send critical alerts to admin room
        if (event.severity === 'critical') {
            this.server.to('role:admin').emit('critical_alert', event);
            this.server.to('role:manager').emit('critical_alert', event);
        }
        
        this.logger.debug(`Alert broadcast: ${event.type} for ${event.itemName}`);
    }

    broadcastNotification(event: NotificationEvent, targetUserId?: string) {
        if (targetUserId) {
            this.server.to(`user:${targetUserId}`).emit('notification', event);
        } else {
            this.server.emit('notification', event);
        }
    }

    broadcastDashboardUpdate(data: any) {
        this.server.emit('dashboard_update', data);
    }

    // Get connected clients count
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }

    // Send to specific user
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    // Send to role
    sendToRole(role: string, event: string, data: any) {
        this.server.to(`role:${role}`).emit(event, data);
    }
}
