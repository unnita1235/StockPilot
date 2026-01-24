import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { API_BASE_URL } from '@/lib/config';

const API_URL = API_BASE_URL;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, rememberMe } = body;

        // Call external backend (NestJS)
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { message: data.message || 'Login failed' },
                { status: res.status }
            );
        }

        // Determine cookie max age
        // 7 days if remember me, else session (undefined/0, but we'll use 1 day for safety or keep session)
        // Actually, "Remember Me" typically implies a persistent cookie vs session cookie.
        // Let's use 30 days for remember me, 1 day for standard.
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 1;

        // Set HttpOnly Cookie
        (await cookies()).set('stockpilot_token', data.data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: maxAge,
            path: '/',
        });

        return NextResponse.json({
            success: true,
            user: data.data.user,
        });
    } catch {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
