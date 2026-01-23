'use client';

/**
 * useStock Hook
 * 
 * Hook for stock operations (add, remove, movements, quick update).
 */

import { useCallback, useState } from 'react';
import { stockApi, ApiInventoryItem } from '@/lib/api';
import { useMutation, useApi } from './useApi';
import { getErrorMessage } from '@/lib/api-client';

// ============================================
// Types
// ============================================

export interface StockMovement {
    _id: string;
    itemId: string;
    type: 'in' | 'out';
    quantity: number;
    reason: string;
    notes?: string;
    createdAt: string;
    userId?: string;
}

export interface AddStockParams {
    itemId: string;
    quantity: number;
    reason: string;
    notes?: string;
}

export interface RemoveStockParams {
    itemId: string;
    quantity: number;
    reason: string;
    notes?: string;
}

export interface QuickUpdateParams {
    id: string;
    stock: number;
}

export interface UseStockReturn {
    /** Add stock to an item */
    addStock: (params: AddStockParams) => Promise<void>;
    /** Remove stock from an item */
    removeStock: (params: RemoveStockParams) => Promise<void>;
    /** Quick update stock level */
    quickUpdate: (id: string, stock: number) => Promise<ApiInventoryItem | null>;
    /** Get stock movements */
    getMovements: (itemId?: string) => Promise<StockMovement[]>;
    /** Loading state for mutations */
    loading: boolean;
    /** Error message */
    error: string | null;
    /** Clear error */
    clearError: () => void;
}

// ============================================
// useStock Hook
// ============================================

export function useStock(): UseStockReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addStock = useCallback(async (params: AddStockParams): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await stockApi.addStock(
                params.itemId,
                params.quantity,
                params.reason,
                params.notes || ''
            );
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const removeStock = useCallback(async (params: RemoveStockParams): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await stockApi.removeStock(
                params.itemId,
                params.quantity,
                params.reason,
                params.notes || ''
            );
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const quickUpdate = useCallback(async (id: string, stock: number): Promise<ApiInventoryItem | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await stockApi.quickUpdate(id, stock);
            return response.data;
        } catch (err) {
            const message = getErrorMessage(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getMovements = useCallback(async (itemId?: string): Promise<StockMovement[]> => {
        try {
            const response = await stockApi.getMovements(itemId);
            return (response as any).data || [];
        } catch (err) {
            console.error('Failed to fetch movements:', err);
            return [];
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        addStock,
        removeStock,
        quickUpdate,
        getMovements,
        loading,
        error,
        clearError,
    };
}

// ============================================
// useStockMovements Hook
// ============================================

export interface UseStockMovementsOptions {
    itemId?: string;
    pollInterval?: number;
}

export function useStockMovements(options: UseStockMovementsOptions = {}) {
    const { itemId, pollInterval = 0 } = options;

    const endpoint = itemId
        ? `/stock/movements?itemId=${itemId}`
        : '/stock/movements';

    const { data, loading, error, refresh, errorMessage } = useApi<{ data: StockMovement[] }>(
        endpoint,
        {
            immediate: true,
            transform: (response) => response as { data: StockMovement[] },
        }
    );

    return {
        movements: data?.data || [],
        loading,
        error: errorMessage,
        refresh,
    };
}
