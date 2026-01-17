/**
 * Standard API Response wrapper for consistent frontend-backend communication
 */

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export function createResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
        success: true,
        data,
        message,
    };
}

export function createPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): ApiResponse<T[]> {
    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}
