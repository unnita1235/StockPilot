/**
 * Robust API Client with Error Handling & Retry Logic
 * 
 * Features:
 * - Typed error handling with ApiError class
 * - Exponential backoff retry for network errors
 * - Request timeout handling (configurable)
 * - Request/response interceptors for logging
 * - Token management (get, set, clear)
 * - Error classification (network, auth, validation, server)
 */

// ============================================
// Types & Interfaces
// ============================================

export type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'timeout' | 'unknown';

export interface ApiErrorDetails {
    message: string;
    type: ErrorType;
    status?: number;
    code?: string;
    errors?: Record<string, string[]>;
    retryable: boolean;
    originalError?: Error;
}

export class ApiError extends Error {
    public readonly type: ErrorType;
    public readonly status?: number;
    public readonly code?: string;
    public readonly errors?: Record<string, string[]>;
    public readonly retryable: boolean;
    public readonly originalError?: Error;

    constructor(details: ApiErrorDetails) {
        super(details.message);
        this.name = 'ApiError';
        this.type = details.type;
        this.status = details.status;
        this.code = details.code;
        this.errors = details.errors;
        this.retryable = details.retryable;
        this.originalError = details.originalError;

        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }

    static isApiError(error: unknown): error is ApiError {
        return error instanceof ApiError;
    }
}

// ============================================
// Configuration
// ============================================

export interface ApiClientConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    retryMultiplier: number;
    onUnauthorized?: () => void;
    debug?: boolean;
}

const defaultConfig: ApiClientConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second base delay
    retryMultiplier: 2, // Exponential backoff multiplier
    debug: process.env.NODE_ENV === 'development',
};

let config: ApiClientConfig = { ...defaultConfig };

export function configureApiClient(newConfig: Partial<ApiClientConfig>): void {
    config = { ...config, ...newConfig };
}

// ============================================
// Token Management
// ============================================

const TOKEN_KEY = 'stockpilot_token';

export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string, persistent = true): void {
    if (typeof window === 'undefined') return;
    if (persistent) {
        localStorage.setItem(TOKEN_KEY, token);
    }
    sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return !!getAuthToken();
}

// ============================================
// Request Interceptors
// ============================================

type RequestInterceptor = (request: RequestInit, url: string) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response, url: string) => Response | Promise<Response>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export function addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    requestInterceptors.push(interceptor);
    return () => {
        const index = requestInterceptors.indexOf(interceptor);
        if (index > -1) requestInterceptors.splice(index, 1);
    };
}

export function addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    responseInterceptors.push(interceptor);
    return () => {
        const index = responseInterceptors.indexOf(interceptor);
        if (index > -1) responseInterceptors.splice(index, 1);
    };
}

// ============================================
// Error Classification
// ============================================

function classifyError(error: unknown, status?: number): ErrorType {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return 'network';
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
        return 'timeout';
    }
    if (status) {
        if (status === 401 || status === 403) return 'auth';
        if (status === 400 || status === 422) return 'validation';
        if (status >= 500) return 'server';
    }
    return 'unknown';
}

function isRetryableError(type: ErrorType, status?: number): boolean {
    // Retry network errors and 5xx server errors
    if (type === 'network' || type === 'timeout') return true;
    if (type === 'server' && status && status >= 500 && status < 600) return true;
    return false;
}

// ============================================
// Retry Logic with Exponential Backoff
// ============================================

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeWithRetry<T>(
    fn: () => Promise<T>,
    options: {
        attempts: number;
        delay: number;
        multiplier: number;
        onRetry?: (attempt: number, error: Error) => void;
    }
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= options.attempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if error is retryable
            const isApiErr = ApiError.isApiError(error);
            const retryable = isApiErr ? error.retryable : true;

            if (!retryable || attempt === options.attempts) {
                throw error;
            }

            // Calculate delay with exponential backoff + jitter
            const baseDelay = options.delay * Math.pow(options.multiplier, attempt - 1);
            const jitter = Math.random() * 0.3 * baseDelay; // Add up to 30% jitter
            const waitTime = baseDelay + jitter;

            if (config.debug) {
                console.log(`[API Client] Retry attempt ${attempt}/${options.attempts} after ${Math.round(waitTime)}ms`, lastError.message);
            }

            options.onRetry?.(attempt, lastError);
            await sleep(waitTime);
        }
    }

    throw lastError;
}

// ============================================
// Core Request Function
// ============================================

export interface RequestOptions extends Omit<RequestInit, 'signal'> {
    timeout?: number;
    retry?: boolean;
    retryAttempts?: number;
    skipAuth?: boolean;
}

interface ApiResponseBody<T = unknown> {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
    errors?: Record<string, string[]>;
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        timeout = config.timeout,
        retry = true,
        retryAttempts = config.retryAttempts,
        skipAuth = false,
        ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${config.baseUrl}${endpoint}`;

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>),
    };

    // Add auth token if not skipped
    if (!skipAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Apply request interceptors
    let requestInit: RequestInit = {
        ...fetchOptions,
        headers,
        credentials: 'include',
    };

    for (const interceptor of requestInterceptors) {
        requestInit = await interceptor(requestInit, url);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestInit.signal = controller.signal;

    const makeRequest = async (): Promise<T> => {
        const startTime = Date.now();

        try {
            if (config.debug) {
                console.log(`[API Client] ${requestInit.method || 'GET'} ${url}`);
            }

            let response = await fetch(url, requestInit);

            // Apply response interceptors
            for (const interceptor of responseInterceptors) {
                response = await interceptor(response, url);
            }

            if (config.debug) {
                console.log(`[API Client] ${response.status} ${url} (${Date.now() - startTime}ms)`);
            }

            // Handle non-OK responses
            if (!response.ok) {
                let body: ApiResponseBody = {};
                try {
                    body = await response.json();
                } catch {
                    // Response may not be JSON
                }

                const errorType = classifyError(null, response.status);
                const message = body.message || body.error || `Request failed with status ${response.status}`;

                // Handle 401 Unauthorized - trigger callback
                if (response.status === 401 && config.onUnauthorized) {
                    config.onUnauthorized();
                }

                throw new ApiError({
                    message,
                    type: errorType,
                    status: response.status,
                    errors: body.errors,
                    retryable: isRetryableError(errorType, response.status),
                });
            }

            // Parse successful response
            const data = await response.json();
            return data as T;
        } catch (error) {
            // Handle fetch/network errors
            if (error instanceof ApiError) {
                throw error;
            }

            const errorType = classifyError(error);
            const message = error instanceof Error ? error.message : 'Unknown error occurred';

            throw new ApiError({
                message: errorType === 'timeout' ? 'Request timed out' : message,
                type: errorType,
                retryable: isRetryableError(errorType),
                originalError: error instanceof Error ? error : undefined,
            });
        } finally {
            clearTimeout(timeoutId);
        }
    };

    // Execute with or without retry
    if (retry && retryAttempts > 1) {
        return executeWithRetry(makeRequest, {
            attempts: retryAttempts,
            delay: config.retryDelay,
            multiplier: config.retryMultiplier,
        });
    }

    return makeRequest();
}

// ============================================
// Convenience Methods
// ============================================

export const api = {
    get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return apiRequest<T>(endpoint, { ...options, method: 'GET' });
    },

    post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return apiRequest<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
    },
};

// ============================================
// Error Handling Utilities
// ============================================

export function getErrorMessage(error: unknown): string {
    if (ApiError.isApiError(error)) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
}

export function isNetworkError(error: unknown): boolean {
    return ApiError.isApiError(error) && error.type === 'network';
}

export function isAuthError(error: unknown): boolean {
    return ApiError.isApiError(error) && error.type === 'auth';
}

export function isValidationError(error: unknown): boolean {
    return ApiError.isApiError(error) && error.type === 'validation';
}

export function isServerError(error: unknown): boolean {
    return ApiError.isApiError(error) && error.type === 'server';
}
