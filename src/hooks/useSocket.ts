'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getSocket, connectSocket, disconnectSocket, isSocketConnected } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

// Event types
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

export interface UseSocketOptions {
    onStockUpdate?: (event: StockUpdateEvent) => void;
    onAlert?: (event: AlertEvent) => void;
    onNotification?: (event: NotificationEvent) => void;
    onDashboardUpdate?: (data: unknown) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    autoRefresh?: boolean; // Automatically trigger refresh callbacks
}

export interface UseSocketReturn {
    isConnected: boolean;
    connectionError: string | null;
    lastStockUpdate: StockUpdateEvent | null;
    lastAlert: AlertEvent | null;
    subscribeToItem: (itemId: string) => void;
    unsubscribeFromItem: (itemId: string) => void;
    emit: <T>(event: string, data?: T) => void;
    reconnect: () => void;
}

/**
 * React hook for WebSocket integration with real-time updates
 * Connects automatically when authenticated, handles reconnection
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
    const { user, isAuthenticated } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [lastStockUpdate, setLastStockUpdate] = useState<StockUpdateEvent | null>(null);
    const [lastAlert, setLastAlert] = useState<AlertEvent | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const optionsRef = useRef(options);

    // Keep options ref updated to avoid stale closures
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const connect = useCallback(() => {
        if (!isAuthenticated || !user) return;

        const socket = getSocket();
        if (!socket) return;

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            setIsConnected(true);
            setConnectionError(null);
            optionsRef.current.onConnect?.();
        });

        socket.on('connected', (data: { message: string; clientId: string }) => {
            console.log('[useSocket] Server confirmed:', data.message);
        });

        socket.on('disconnect', (reason) => {
            setIsConnected(false);
            optionsRef.current.onDisconnect?.();
            console.log('[useSocket] Disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            setConnectionError(`Connection failed: ${error.message}`);
            console.warn('[useSocket] Connection error:', error.message);
        });

        // Stock update events
        socket.on('stock_update', (data: StockUpdateEvent) => {
            setLastStockUpdate(data);
            optionsRef.current.onStockUpdate?.(data);
        });

        socket.on('item_stock_update', (data: StockUpdateEvent) => {
            setLastStockUpdate(data);
            optionsRef.current.onStockUpdate?.(data);
        });

        // Alert events
        socket.on('alert', (data: AlertEvent) => {
            setLastAlert(data);
            optionsRef.current.onAlert?.(data);
        });

        socket.on('critical_alert', (data: AlertEvent) => {
            setLastAlert(data);
            optionsRef.current.onAlert?.(data);
        });

        // Notification events
        socket.on('notification', (data: NotificationEvent) => {
            optionsRef.current.onNotification?.(data);
        });

        // Dashboard updates
        socket.on('dashboard_update', (data: unknown) => {
            optionsRef.current.onDashboardUpdate?.(data);
        });

        // Connect with authentication
        connectSocket(user.id || user._id || '', user.role || 'staff');
    }, [isAuthenticated, user]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current = null;
        }
        disconnectSocket();
        setIsConnected(false);
    }, []);

    const subscribeToItem = useCallback((itemId: string) => {
        const socket = socketRef.current;
        if (socket?.connected) {
            socket.emit('subscribe_item', itemId);
        }
    }, []);

    const unsubscribeFromItem = useCallback((itemId: string) => {
        const socket = socketRef.current;
        if (socket?.connected) {
            socket.emit('unsubscribe_item', itemId);
        }
    }, []);

    const emit = useCallback(<T,>(event: string, data?: T) => {
        const socket = socketRef.current;
        if (socket?.connected) {
            socket.emit(event, data);
        }
    }, []);

    const reconnect = useCallback(() => {
        disconnect();
        setTimeout(connect, 100);
    }, [connect, disconnect]);

    // Auto-connect when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [isAuthenticated, connect, disconnect]);

    return {
        isConnected,
        connectionError,
        lastStockUpdate,
        lastAlert,
        subscribeToItem,
        unsubscribeFromItem,
        emit,
        reconnect,
    };
}

/**
 * Simple hook that only tracks connection status
 * Lightweight alternative when you don't need event handlers
 */
export function useSocketStatus(): { isConnected: boolean; reconnect: () => void } {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const checkConnection = () => {
            setIsConnected(isSocketConnected());
        };

        // Check immediately and set up interval
        checkConnection();
        const interval = setInterval(checkConnection, 1000);

        return () => clearInterval(interval);
    }, []);

    const reconnect = useCallback(() => {
        const socket = getSocket();
        if (socket && !socket.connected) {
            socket.connect();
        }
    }, []);

    return { isConnected, reconnect };
}
