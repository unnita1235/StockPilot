'use client';

/**
 * useAuth Hook
 * 
 * Re-exports the existing auth context hook and adds
 * additional utility methods for token management.
 */

import { useContext, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, User, AuthResponse } from '@/lib/api';
import { getAuthToken, setAuthToken, clearAuthToken, isAuthenticated } from '@/lib/api-client';
import { useMutation } from './useApi';

// Re-export from context for convenience
export { useAuth } from '@/contexts/auth-context';

// ============================================
// Types
// ============================================

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
}

export interface UseAuthActionsReturn {
    /** Login mutation */
    login: ReturnType<typeof useMutation<AuthResponse, LoginCredentials>>;
    /** Register mutation */
    register: ReturnType<typeof useMutation<AuthResponse, RegisterCredentials>>;
    /** Logout function */
    logout: () => Promise<void>;
    /** Check if user is authenticated */
    isAuthenticated: boolean;
    /** Get current token */
    getToken: () => string | null;
}

// ============================================
// useAuthActions Hook
// ============================================

export function useAuthActions(): UseAuthActionsReturn {
    const router = useRouter();

    const loginMutation = useMutation<AuthResponse, LoginCredentials>(
        '/auth/login',
        'POST',
        {
            onSuccess: (data) => {
                if (data.token) {
                    setAuthToken(data.token);
                }
            },
        }
    );

    const registerMutation = useMutation<AuthResponse, RegisterCredentials>(
        '/auth/register',
        'POST',
        {
            onSuccess: (data) => {
                if (data.token) {
                    setAuthToken(data.token);
                }
            },
        }
    );

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } finally {
            clearAuthToken();
            router.push('/login');
        }
    }, [router]);

    return useMemo(() => ({
        login: loginMutation,
        register: registerMutation,
        logout,
        isAuthenticated: isAuthenticated(),
        getToken: getAuthToken,
    }), [loginMutation, registerMutation, logout]);
}

// ============================================
// Token Utilities
// ============================================

/**
 * Check if the current token appears to be expired
 * Note: This is a simple check based on JWT structure
 */
export function isTokenExpired(): boolean {
    const token = getAuthToken();
    if (!token) return true;

    try {
        // JWT tokens have 3 parts separated by dots
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        // Decode payload (second part)
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return false; // No expiry set

        // Check if expired (with 1 minute buffer)
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now + 60;
    } catch {
        return true;
    }
}

/**
 * Get remaining token lifetime in seconds
 */
export function getTokenTimeRemaining(): number | null {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return null;

        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, payload.exp - now);
    } catch {
        return null;
    }
}
