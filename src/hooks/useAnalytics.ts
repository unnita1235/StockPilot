'use client';

/**
 * useAnalytics Hook
 * 
 * Hook for analytics API operations with proper loading/error states.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    analyticsApi,
    DashboardStats,
    TrendData,
    Alert,
    AlertSummary,
    ApiResponse
} from '@/lib/api';
import { useApi, useMutation } from './useApi';
import { ApiError, getErrorMessage } from '@/lib/api-client';

// ============================================
// Types
// ============================================

export interface AnalyticsState {
    stats: DashboardStats | null;
    trends: TrendData[];
    alerts: Alert[];
    alertSummary: AlertSummary;
    loading: boolean;
    error: string | null;
    isOnline: boolean;
}

export interface UseAnalyticsOptions {
    /** Poll interval in ms, 0 to disable (default: 30000) */
    pollInterval?: number;
    /** Whether to fetch on mount (default: true) */
    immediate?: boolean;
}

export interface UseAnalyticsReturn extends AnalyticsState {
    /** Refresh all analytics data */
    refresh: () => Promise<void>;
    /** Fetch dashboard stats only */
    fetchDashboard: () => Promise<DashboardStats | null>;
    /** Fetch trends for a specific period */
    fetchTrends: (period?: string) => Promise<TrendData[]>;
    /** Fetch alerts */
    fetchAlerts: () => Promise<{ data: Alert[]; summary: AlertSummary } | null>;
}

// Default values
const defaultStats: DashboardStats = {
    totalItems: 0,
    lowStockItems: 0,
    lowStockPercentage: 0,
    categoryBreakdown: {},
    recentMovements: 0,
    totalInventoryValue: 0,
    weeklyActivity: { stockIn: 0, stockOut: 0, movementsIn: 0, movementsOut: 0 },
};

const defaultAlertSummary: AlertSummary = {
    critical: 0,
    warning: 0,
    info: 0,
    data: [],
};

// ============================================
// useAnalytics Hook
// ============================================

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
    const { pollInterval = 30000, immediate = true } = options;

    const [state, setState] = useState<AnalyticsState>({
        stats: null,
        trends: [],
        alerts: [],
        alertSummary: defaultAlertSummary,
        loading: immediate,
        error: null,
        isOnline: true,
    });

    // Fetch dashboard stats
    const fetchDashboard = useCallback(async (): Promise<DashboardStats | null> => {
        try {
            const response = await analyticsApi.getDashboard();
            const stats = response.data;
            setState(prev => ({
                ...prev,
                stats,
                isOnline: true,
                error: null,
            }));
            return stats;
        } catch (error) {
            const message = getErrorMessage(error);
            const isNetworkError = message.includes('Failed to fetch') || message.includes('Network');

            if (isNetworkError) {
                setState(prev => ({ ...prev, isOnline: false }));
            } else {
                setState(prev => ({ ...prev, error: message }));
            }
            return null;
        }
    }, []);

    // Fetch trends
    const fetchTrends = useCallback(async (period = '7d'): Promise<TrendData[]> => {
        try {
            const response = await analyticsApi.getTrends(period);
            const trends = response.data;
            setState(prev => ({ ...prev, trends, isOnline: true }));
            return trends;
        } catch (error) {
            console.error('Failed to fetch trends:', error);
            return [];
        }
    }, []);

    // Fetch alerts
    const fetchAlerts = useCallback(async (): Promise<{ data: Alert[]; summary: AlertSummary } | null> => {
        try {
            const response = await analyticsApi.getAlerts();
            setState(prev => ({
                ...prev,
                alerts: response.data,
                alertSummary: response.summary,
                isOnline: true,
            }));
            return response;
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
            return null;
        }
    }, []);

    // Refresh all data
    const refresh = useCallback(async (): Promise<void> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            await Promise.all([
                fetchDashboard(),
                fetchTrends(),
                fetchAlerts(),
            ]);
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [fetchDashboard, fetchTrends, fetchAlerts]);

    // Initial fetch
    useEffect(() => {
        if (immediate) {
            refresh();
        }
    }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

    // Polling
    useEffect(() => {
        if (pollInterval <= 0 || !state.isOnline) return;

        const interval = setInterval(() => {
            // Silent refresh (don't set loading state)
            Promise.all([
                fetchDashboard(),
                fetchTrends(),
                fetchAlerts(),
            ]).catch(console.error);
        }, pollInterval);

        return () => clearInterval(interval);
    }, [pollInterval, state.isOnline, fetchDashboard, fetchTrends, fetchAlerts]);

    return {
        ...state,
        refresh,
        fetchDashboard,
        fetchTrends,
        fetchAlerts,
    };
}

// ============================================
// Convenience Hooks
// ============================================

/**
 * Hook for just dashboard stats
 */
export function useDashboardStats(options: { pollInterval?: number } = {}) {
    const { pollInterval = 30000 } = options;

    const dashboard = useApi<ApiResponse<DashboardStats>>(
        '/analytics/dashboard',
        {
            immediate: true,
            transform: (data) => data as ApiResponse<DashboardStats>,
        }
    );

    // Polling
    useEffect(() => {
        if (pollInterval <= 0 || dashboard.loading) return;

        const interval = setInterval(() => {
            dashboard.refresh();
        }, pollInterval);

        return () => clearInterval(interval);
    }, [pollInterval, dashboard.loading]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        stats: dashboard.data?.data ?? null,
        loading: dashboard.loading,
        error: dashboard.errorMessage,
        refresh: dashboard.refresh,
    };
}

/**
 * Hook for alerts only
 */
export function useAlerts(options: { pollInterval?: number } = {}) {
    const { pollInterval = 60000 } = options; // Less frequent for alerts

    const alerts = useApi<ApiResponse<Alert[]> & { summary: AlertSummary }>(
        '/analytics/alerts',
        { immediate: true }
    );

    // Polling
    useEffect(() => {
        if (pollInterval <= 0 || alerts.loading) return;

        const interval = setInterval(() => {
            alerts.refresh();
        }, pollInterval);

        return () => clearInterval(interval);
    }, [pollInterval, alerts.loading]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        alerts: alerts.data?.data ?? [],
        summary: alerts.data?.summary ?? defaultAlertSummary,
        loading: alerts.loading,
        error: alerts.errorMessage,
        refresh: alerts.refresh,
    };
}
