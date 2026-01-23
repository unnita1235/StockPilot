'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useWebSocket, NotificationEvent, AlertEvent } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: NotificationEvent[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const { toast } = useToast();

  const handleNotification = useCallback((event: NotificationEvent) => {
    setNotifications(prev => [event, ...prev].slice(0, 50)); // Keep last 50
    toast({
      title: event.title,
      description: event.message,
      variant: event.type === 'error' ? 'destructive' : 'default',
    });
  }, [toast]);

  const handleAlert = useCallback((event: AlertEvent) => {
    const notification: NotificationEvent = {
      id: `alert_${Date.now()}`,
      type: event.severity === 'critical' ? 'error' : 'warning',
      title: event.type === 'out_of_stock' ? 'Out of Stock' : 'Low Stock Alert',
      message: event.message,
      timestamp: event.timestamp,
      read: false,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    toast({
      title: notification.title,
      description: notification.message,
      variant: event.severity === 'critical' ? 'destructive' : 'default',
    });
  }, [toast]);

  const { isConnected } = useWebSocket({
    onNotification: handleNotification,
    onAlert: handleAlert,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
