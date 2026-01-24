/**
 * Centralized configuration for the frontend.
 * 
 * API_BASE_URL:
 * - Defaults to 'http://localhost:3000/api' for local development.
 * - Can be overridden by NEXT_PUBLIC_API_BASE_URL environment variable.
 * - In production (Vercel/Railway), this should be set to the backend URL.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
