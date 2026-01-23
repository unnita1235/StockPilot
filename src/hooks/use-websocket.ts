'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '').replace('http', 'ws') || 'ws://localhost:5000') + '/ws';

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
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!isAuthenticated || socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // For now, we'll use a simple implementation that degrades gracefully
      // In production, you'd use socket.io-client for better compatibility
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Authenticate with user info
        if (user) {
          ws.send(JSON.stringify({
            event: 'authenticate',
            data: { userId: user.id || user._id, role: user.role || 'staff' }
          }));
        }
        
        handlers.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.event) {
            case 'stock_update':
            case 'item_stock_update':
              handlers.onStockUpdate?.(data.data);
              break;
            case 'alert':
            case 'critical_alert':
              handlers.onAlert?.(data.data);
              break;
            case 'notification':
              handlers.onNotification?.(data.data);
              break;
            case 'dashboard_update':
              handlers.onDashboardUpdate?.(data.data);
              break;
          }
        } catch (e) {
          console.warn('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        handlers.onDisconnect?.();
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket error (will fallback to polling):', error);
        setConnectionError('WebSocket connection failed - using polling fallback');
      };

      socketRef.current = ws;
    } catch (error) {
      console.warn('WebSocket initialization failed:', error);
      setConnectionError('WebSocket not available - using polling fallback');
    }
  }, [isAuthenticated, user, handlers]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const subscribeToItem = useCallback((itemId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'subscribe_item',
        data: itemId
      }));
    }
  }, []);

  const unsubscribeFromItem = useCallback((itemId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'unsubscribe_item',
        data: itemId
      }));
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
