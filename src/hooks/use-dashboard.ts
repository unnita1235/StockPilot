'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyticsApi, DashboardStats, TrendData, Alert, AlertSummary } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

type UseDashboardOptions = {
  pollInterval?: number;
  enableRealtime?: boolean;
};

export function useDashboard(options: UseDashboardOptions = {}) {
  const { pollInterval = 30000, enableRealtime = true } = options;
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary>({ critical: 0, warning: 0, info: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!isOnline && silent) return; // Don't background poll if we know we are offline

    if (!silent) setLoading(true);
    setError(null);

    try {
      const [statsRes, trendsRes, alertsRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getTrends('7d'),
        analyticsApi.getAlerts(),
      ]);

      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setAlerts(alertsRes.data);
      setAlertSummary(alertsRes.summary);
      setIsOnline(true);
    } catch (err) {
      if (!silent) {
        // Only show error if it's NOT a connection refused (offline) error
        const errorMessage = err instanceof Error ? err.message : String(err);
        const isNetworkError = errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Connection refused');

        if (isNetworkError) {
          console.log('Dashboard offline mode active');
          setIsOnline(false);
        } else {
          setError(errorMessage);
        }
      }

      // Set fallback/empty data
      setStats(prev => {
        if (prev) return prev;
        return {
          totalItems: 0,
          lowStockItems: 0,
          lowStockPercentage: 0,
          categoryBreakdown: {},
          recentMovements: 0,
          totalInventoryValue: 0,
          weeklyActivity: { stockIn: 0, stockOut: 0, movementsIn: 0, movementsOut: 0 },
        };
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (pollInterval <= 0 || !isOnline) return;

    const interval = setInterval(() => {
      fetchDashboard(true);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, isOnline, fetchDashboard]);

  // Real-time WebSocket integration
  const { isConnected: wsConnected, lastStockUpdate } = useSocket(
    enableRealtime
      ? {
        onStockUpdate: () => {
          // Refresh dashboard when stock changes
          fetchDashboard(true);
        },
        onAlert: (alert) => {
          // Show toast for alerts
          toast({
            title: alert.type === 'out_of_stock' ? '⚠️ Out of Stock!' : '📉 Low Stock Alert',
            description: alert.message,
            variant: alert.severity === 'critical' ? 'destructive' : 'default',
          });
          // Refresh to get updated alert counts
          fetchDashboard(true);
        },
        onDashboardUpdate: () => {
          fetchDashboard(true);
        },
      }
      : {}
  );

  const refresh = useCallback(() => {
    return fetchDashboard(false);
  }, [fetchDashboard]);

  return {
    stats,
    trends,
    alerts,
    alertSummary,
    loading,
    error,
    refresh,
    wsConnected,
    lastStockUpdate,
  };
}
