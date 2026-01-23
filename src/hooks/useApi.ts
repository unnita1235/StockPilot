'use client';

/**
 * Generic API Hook
 * 
 * Provides a reusable hook for API calls with:
 * - Loading, error, data states
 * - Automatic retry support
 * - Mutation support for POST/PUT/DELETE
 * - AbortController for cancellation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiRequest, RequestOptions, ApiError, getErrorMessage } from '@/lib/api-client';

// ============================================
// Types
// ============================================

export interface UseApiState<T> {
    data: T | null;
    error: ApiError | null;
    loading: boolean;
    isIdle: boolean;
    isSuccess: boolean;
    isError: boolean;
}

export interface UseApiOptions<T> extends Omit<RequestOptions, 'signal'> {
    /** Whether to fetch on mount */
    immediate?: boolean;
    /** Initial data value */
    initialData?: T | null;
    /** Callback on success */
    onSuccess?: (data: T) => void;
    /** Callback on error */
    onError?: (error: ApiError) => void;
    /** Transform response data */
    transform?: (data: unknown) => T;
    /** Dependencies that trigger refetch when changed */
    deps?: unknown[];
}

export interface UseApiReturn<T, P = void> extends UseApiState<T> {
    /** Execute the request */
    execute: P extends void ? () => Promise<T | null> : (params: P) => Promise<T | null>;
    /** Refresh (re-execute with same params) */
    refresh: () => Promise<T | null>;
    /** Clear data and error */
    reset: () => void;
    /** Set data manually */
    setData: (data: T | null) => void;
    /** Error message string */
    errorMessage: string | null;
}

// ============================================
// useApi Hook - For GET requests
// ============================================

export function useApi<T>(
    endpoint: string | null,
    options: UseApiOptions<T> = {}
): UseApiReturn<T, void> {
    const {
        immediate = true,
        initialData = null,
        onSuccess,
        onError,
        transform,
        deps = [],
        ...requestOptions
    } = options;

    const [state, setState] = useState<UseApiState<T>>({
        data: initialData,
        error: null,
        loading: immediate && !!endpoint,
        isIdle: !immediate,
        isSuccess: false,
        isError: false,
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    const execute = useCallback(async (): Promise<T | null> => {
        if (!endpoint) {
            return null;
        }

        // Cancel any pending request
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setState(prev => ({
            ...prev,
            loading: true,
            error: null,
            isIdle: false,
            isError: false,
        }));

        try {
            const response = await apiRequest<T>(endpoint, {
                method: 'GET',
                ...requestOptions,
            });

            const data = transform ? transform(response) : response;

            if (mountedRef.current) {
                setState({
                    data,
                    error: null,
                    loading: false,
                    isIdle: false,
                    isSuccess: true,
                    isError: false,
                });
                onSuccess?.(data);
            }

            return data;
        } catch (error) {
            const apiError = error instanceof ApiError
                ? error
                : new ApiError({
                    message: getErrorMessage(error),
                    type: 'unknown',
                    retryable: false,
                });

            if (mountedRef.current) {
                setState(prev => ({
                    ...prev,
                    error: apiError,
                    loading: false,
                    isIdle: false,
                    isSuccess: false,
                    isError: true,
                }));
                onError?.(apiError);
            }

            return null;
        }
    }, [endpoint, requestOptions, transform, onSuccess, onError]);

    const refresh = useCallback(() => execute(), [execute]);

    const reset = useCallback(() => {
        abortControllerRef.current?.abort();
        setState({
            data: initialData,
            error: null,
            loading: false,
            isIdle: true,
            isSuccess: false,
            isError: false,
        });
    }, [initialData]);

    const setData = useCallback((data: T | null) => {
        setState(prev => ({ ...prev, data }));
    }, []);

    // Auto-fetch on mount and deps change
    useEffect(() => {
        if (immediate && endpoint) {
            execute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, immediate, ...deps]);

    return {
        ...state,
        execute,
        refresh,
        reset,
        setData,
        errorMessage: state.error ? getErrorMessage(state.error) : null,
    };
}

// ============================================
// useMutation Hook - For POST/PUT/DELETE requests
// ============================================

export interface UseMutationOptions<T, P> extends Omit<RequestOptions, 'body' | 'signal'> {
    /** Callback on success */
    onSuccess?: (data: T, params: P) => void;
    /** Callback on error */
    onError?: (error: ApiError, params: P) => void;
    /** Transform response data */
    transform?: (data: unknown) => T;
}

export interface UseMutationReturn<T, P> extends UseApiState<T> {
    /** Execute the mutation */
    mutate: (params: P) => Promise<T | null>;
    /** Execute and return promise (throws on error) */
    mutateAsync: (params: P) => Promise<T>;
    /** Reset mutation state */
    reset: () => void;
    /** Error message string */
    errorMessage: string | null;
}

export function useMutation<T, P = void>(
    endpoint: string | ((params: P) => string),
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
    options: UseMutationOptions<T, P> = {}
): UseMutationReturn<T, P> {
    const { onSuccess, onError, transform, ...requestOptions } = options;

    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        error: null,
        loading: false,
        isIdle: true,
        isSuccess: false,
        isError: false,
    });

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const mutate = useCallback(async (params: P): Promise<T | null> => {
        const url = typeof endpoint === 'function' ? endpoint(params) : endpoint;

        setState(prev => ({
            ...prev,
            loading: true,
            error: null,
            isIdle: false,
            isError: false,
        }));

        try {
            const response = await apiRequest<T>(url, {
                method,
                body: params !== undefined ? JSON.stringify(params) : undefined,
                ...requestOptions,
            });

            const data = transform ? transform(response) : response;

            if (mountedRef.current) {
                setState({
                    data,
                    error: null,
                    loading: false,
                    isIdle: false,
                    isSuccess: true,
                    isError: false,
                });
                onSuccess?.(data, params);
            }

            return data;
        } catch (error) {
            const apiError = error instanceof ApiError
                ? error
                : new ApiError({
                    message: getErrorMessage(error),
                    type: 'unknown',
                    retryable: false,
                });

            if (mountedRef.current) {
                setState(prev => ({
                    ...prev,
                    error: apiError,
                    loading: false,
                    isIdle: false,
                    isSuccess: false,
                    isError: true,
                }));
                onError?.(apiError, params);
            }

            return null;
        }
    }, [endpoint, method, requestOptions, transform, onSuccess, onError]);

    const mutateAsync = useCallback(async (params: P): Promise<T> => {
        const result = await mutate(params);
        if (result === null && state.error) {
            throw state.error;
        }
        return result as T;
    }, [mutate, state.error]);

    const reset = useCallback(() => {
        setState({
            data: null,
            error: null,
            loading: false,
            isIdle: true,
            isSuccess: false,
            isError: false,
        });
    }, []);

    return {
        ...state,
        mutate,
        mutateAsync,
        reset,
        errorMessage: state.error ? getErrorMessage(state.error) : null,
    };
}

// ============================================
// Utility Hook - useApiStatus
// ============================================

export interface ApiStatusState {
    isOnline: boolean;
    lastCheck: Date | null;
}

export function useApiStatus(checkInterval = 30000): ApiStatusState {
    const [status, setStatus] = useState<ApiStatusState>({
        isOnline: true,
        lastCheck: null,
    });

    useEffect(() => {
        const checkStatus = async () => {
            try {
                await apiRequest('/health', {
                    timeout: 5000,
                    retry: false,
                });
                setStatus({ isOnline: true, lastCheck: new Date() });
            } catch {
                setStatus({ isOnline: false, lastCheck: new Date() });
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, checkInterval);
        return () => clearInterval(interval);
    }, [checkInterval]);

    return status;
}
