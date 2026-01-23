'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { io, Socket } from 'socket.io-client';

// Build Socket.IO URL: use NEXT_PUBLIC_WS_URL or derive from API URL
const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  // Remove /api suffix to get base URL
  return apiUrl.replace('/api', '');
};

const SOCKET_URL = getSocketUrl();

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

type WebSocketEventHandlers = {
  onStockUpdate?: (event: StockUpdateEvent) => void;
  onAlert?: (event: AlertEvent) => void;
  onNotification?: (event: NotificationEvent) => void;
  onDashboardUpdate?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export function useWebSocket(handlers: WebSocketEventHandlers = {}) {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref updated to avoid stale closures
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const connect = useCallback(() => {
    if (!isAuthenticated || socketRef.current?.connected) {
      return;
    }

    try {
      // Create Socket.IO connection with /ws namespace (matching backend)
      const socket = io(`${SOCKET_URL}/ws`, {
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      });

      // Connection established
      socket.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);

        // Authenticate with user info
        if (user) {
          socket.emit('authenticate', {
            userId: user.id || user._id,
            role: user.role || 'staff',
          });
        }

        handlersRef.current.onConnect?.();
      });

      // Connection confirmation from server
      socket.on('connected', (data) => {
        console.log('Server confirmed connection:', data.message);
      });

      // Stock update events
      socket.on('stock_update', (data: StockUpdateEvent) => {
        handlersRef.current.onStockUpdate?.(data);
      });

      socket.on('item_stock_update', (data: StockUpdateEvent) => {
        handlersRef.current.onStockUpdate?.(data);
      });

      // Alert events
      socket.on('alert', (data: AlertEvent) => {
        handlersRef.current.onAlert?.(data);
      });

      socket.on('critical_alert', (data: AlertEvent) => {
        handlersRef.current.onAlert?.(data);
      });

      // Notification events
      socket.on('notification', (data: NotificationEvent) => {
        handlersRef.current.onNotification?.(data);
      });

      // Dashboard update events
      socket.on('dashboard_update', (data: any) => {
        handlersRef.current.onDashboardUpdate?.(data);
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        handlersRef.current.onDisconnect?.();
        console.log('Socket.IO disconnected:', reason);
      });

      // Connection error
      socket.on('connect_error', (error) => {
        console.warn('Socket.IO connection error (will fallback to polling):', error.message);
        setConnectionError('Socket connection failed - using polling fallback');
      });

      socketRef.current = socket;
    } catch (error) {
      console.warn('Socket.IO initialization failed:', error);
      setConnectionError('Socket not available - using polling fallback');
    }
  }, [isAuthenticated, user]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const subscribeToItem = useCallback((itemId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_item', itemId);
    }
  }, []);

  const unsubscribeFromItem = useCallback((itemId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe_item', itemId);
    }
  }, []);

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
    subscribeToItem,
    unsubscribeFromItem,
    reconnect: connect,
  };
}
