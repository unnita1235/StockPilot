'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyticsApi, DashboardStats, TrendData, Alert, AlertSummary } from '@/lib/api';

type UseDashboardOptions = {
  pollInterval?: number;
};

export function useDashboard(options: UseDashboardOptions = {}) {
  const { pollInterval = 30000 } = options; // Default 30s for dashboard

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary>({ critical: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (silent = false) => {
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
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      }
      // Set fallback/empty data
      if (!stats) {
        setStats({
          totalItems: 0,
          lowStockItems: 0,
          lowStockPercentage: 0,
          categoryBreakdown: {},
          recentMovements: 0,
          totalInventoryValue: 0,
          weeklyActivity: { stockIn: 0, stockOut: 0, movementsIn: 0, movementsOut: 0 },
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(() => {
      fetchDashboard(true);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, fetchDashboard]);

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
  };
}
