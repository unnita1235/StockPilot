import { User } from '@/lib/api';

// Auth State Interface
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Login via Next.js Route Handler (which sets the cookie)
export async function login(email: string, password: string, rememberMe: boolean = false): Promise<User> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Login failed');
    }

    return data.user;
}

// Logout via Next.js Route Handler
export async function logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Also clear local storage user data if any (we persist user info for UI config sometimes)
    if (typeof window !== 'undefined') {
        localStorage.removeItem('stockpilot_user');
    }
}

// Helper to get user role
export function getUserRole(user: User | null): string {
    return user?.role || 'viewer';
}

// Helper to check permissions
export function hasPermission(user: User | null, requiredRole: string[]): boolean {
    if (!user || !user.role) return false;
    return requiredRole.includes(user.role);
}
