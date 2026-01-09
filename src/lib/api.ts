const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export interface User {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  role?: string;
}


export interface AuthResponse {
  token: string;
  user: User;
}
// Update WrappedAuthResponse to be a generic wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: AlertSummary; // For alerts endpoint
}


export interface AuthResult {
  data: AuthResponse;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  lowStockPercentage: number;
  categoryBreakdown: { [key: string]: number };
  recentMovements?: number;
  totalInventoryValue?: number;
  weeklyActivity: {
    stockIn: number;
    stockOut: number;
    movementsIn: number;
    movementsOut: number;
  };
}

export interface TrendData {
  date: string;
  in: number;
  out: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  itemId?: string;
  createdAt: string;
}

export interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
  data: Alert[];
}

export interface ApiInventoryItem {
  _id: string;
  name: string;
  description: string;
  stock: number;
  category: string;
  lowStockThreshold: number;
  sku?: string;
  unitPrice?: number;
  isLowStock: boolean;
}

// Get auth token from localStorage or cookies
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('stockpilot_token') || sessionStorage.getItem('stockpilot_token');
  }
  return null;
}

// Set auth token
function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('stockpilot_token', token);
    sessionStorage.setItem('stockpilot_token', token);
  }
}

// Clear auth token
function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('stockpilot_token');
    sessionStorage.removeItem('stockpilot_token');
  }
}

// API request helper
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiErrorResponse = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || `API Error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('Connection refused'))) {
      console.warn(`API Network Error [${endpoint}]:`, error.message);
    } else {
      console.error(`API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

// Authentication endpoints
export const authApi = {
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await apiRequest<ApiResponse<AuthResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    const authData = response.data;
    if (authData.token) {
      setAuthToken(authData.token);
    }
    return authData;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest<ApiResponse<AuthResponse>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const authData = response.data;
      if (authData.token) {
        setAuthToken(authData.token);
      }
      return authData;
    } catch (error) {
      console.warn('Login failed, checking for offline mode...', error);
      // Fallback for offline/demo mode if backend is unreachable
      // We check for common network error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNetworkError = errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Connection refused');

      if (isNetworkError) {
        console.log('Backend unreachable. Activating Offline Demo Mode.');
        const mockToken = 'mock-offline-token-' + Date.now();
        const mockUser: User = {
          id: 'offline-user-id',
          _id: 'offline-user-id',
          email: email,
          name: 'Offline Admin (Demo)',
          role: 'admin'
        };

        setAuthToken(mockToken);
        return {
          token: mockToken,
          user: mockUser
        };
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    clearAuthToken();
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Logout always succeeds locally
    }
  },

  getToken(): string | null {
    return getAuthToken();
  },

  isAuthenticated(): boolean {
    return !!getAuthToken();
  },
};

// Items endpoints
export const itemsApi = {
  async getAll(filters?: { category?: string; search?: string; lowStock?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.lowStock) params.append('lowStock', 'true');

    const queryString = params.toString();
    const endpoint = queryString ? `/items?${queryString}` : '/items';

    const response = await apiRequest<ApiResponse<ApiInventoryItem[]>>(endpoint, { method: 'GET' });
    return response;
  },

  async getById(id: string) {
    const response = await apiRequest<ApiResponse<ApiInventoryItem>>(`/items/${id}`, { method: 'GET' });
    return response;
  },

  async create(data: Partial<ApiInventoryItem>) {
    const response = await apiRequest<ApiResponse<ApiInventoryItem>>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  async update(id: string, data: Partial<ApiInventoryItem>) {
    const response = await apiRequest<ApiResponse<ApiInventoryItem>>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  },

  async delete(id: string) {
    return apiRequest(`/items/${id}`, {
      method: 'DELETE',
    });
  },
};

// Stock endpoints
export const stockApi = {
  async addStock(itemId: string, quantity: number, reason: string, notes: string = '') {
    return apiRequest('/stock/add', {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity, reason, notes }),
    });
  },

  async removeStock(itemId: string, quantity: number, reason: string, notes: string = '') {
    return apiRequest('/stock/remove', {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity, reason, notes }),
    });
  },

  async getMovements(itemId?: string) {
    const endpoint = itemId ? `/stock/movements?itemId=${itemId}` : '/stock/movements';
    return apiRequest(endpoint);
  },

  async quickUpdate(id: string, stock: number) {
    return apiRequest<{ data: ApiInventoryItem }>(`/stock/quick-update/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    });
  },
};

// Analytics endpoints
export const analyticsApi = {
  async getDashboard() {
    const response = await apiRequest<ApiResponse<DashboardStats>>('/analytics/dashboard');
    return response;
  },

  async getTrends(period: string = 'month') {
    const response = await apiRequest<ApiResponse<TrendData[]>>(`/analytics/trends?period=${period}`);
    return response;
  },

  async getReport(type: string) {
    return apiRequest(`/analytics/report?type=${type}`);
  },

  async getAlerts() {
    const response = await apiRequest<ApiResponse<Alert[]>>('/analytics/alerts');
    return { data: response.data, summary: response.summary! };
  },
};

// Health check
export const healthApi = {
  async check() {
    return apiRequest('/health');
  },
};
