'use client';

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './config';

// Build Socket.IO URL: use NEXT_PUBLIC_WS_URL or derive from API URL
const getSocketUrl = (): string => {
    if (typeof window === 'undefined') {
        return ''; // SSR - no socket
    }

    if (process.env.NEXT_PUBLIC_WS_URL) {
        return process.env.NEXT_PUBLIC_WS_URL;
    }

    // Remove /api suffix to get base URL
    return API_BASE_URL.replace('/api', '');
};

// Socket configuration
const SOCKET_CONFIG = {
    namespace: '/ws',
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 20000,
};

// Singleton socket instance
let socketInstance: Socket | null = null;

/**
 * Get or create the Socket.IO client instance
 * Uses singleton pattern to ensure only one connection per client
 */
export function getSocket(): Socket | null {
    if (typeof window === 'undefined') {
        return null; // SSR guard
    }

    if (!socketInstance) {
        const url = getSocketUrl();
        if (!url) return null;

        socketInstance = io(`${url}${SOCKET_CONFIG.namespace}`, {
            transports: ['websocket', 'polling'],
            autoConnect: false, // Manual connect after auth
            reconnection: true,
            reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts,
            reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
            reconnectionDelayMax: SOCKET_CONFIG.reconnectionDelayMax,
            timeout: SOCKET_CONFIG.timeout,
        });

        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
            socketInstance.on('connect', () => {
                console.log('[Socket.IO] Connected:', socketInstance?.id);
            });

            socketInstance.on('disconnect', (reason) => {
                console.log('[Socket.IO] Disconnected:', reason);
            });

            socketInstance.on('connect_error', (error) => {
                console.warn('[Socket.IO] Connection error:', error.message);
            });
        }
    }

    return socketInstance;
}

/**
 * Connect the socket with authentication
 */
export function connectSocket(userId: string, role: string): void {
    const socket = getSocket();
    if (!socket) return;

    if (!socket.connected) {
        socket.connect();
    }

    // Authenticate once connected
    socket.once('connect', () => {
        socket.emit('authenticate', { userId, role });
    });

    // If already connected, send auth immediately
    if (socket.connected) {
        socket.emit('authenticate', { userId, role });
    }
}

/**
 * Disconnect the socket cleanly
 */
export function disconnectSocket(): void {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
}

/**
 * Check if socket is currently connected
 */
export function isSocketConnected(): boolean {
    return socketInstance?.connected ?? false;
}

/**
 * Get socket connection ID
 */
export function getSocketId(): string | undefined {
    return socketInstance?.id;
}

// Event types that match backend gateway
export type SocketEventType =
    | 'stock_update'
    | 'item_stock_update'
    | 'alert'
    | 'critical_alert'
    | 'notification'
    | 'dashboard_update'
    | 'connected';

// Export socket instance for direct access if needed
export { socketInstance };
