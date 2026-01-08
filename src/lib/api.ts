const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export interface WrappedAuthResponse {
  success: boolean;
  data: AuthResponse;
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
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }
  return null;
}

// Set auth token
function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_token', token);
  }
}

// Clear auth token
function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
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
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Authentication endpoints
export const authApi = {
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await apiRequest<WrappedAuthResponse>('/auth/register', {
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
    const response = await apiRequest<WrappedAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const authData = response.data;
    if (authData.token) {
      setAuthToken(authData.token);
    }
    return authData;
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
  async getAll() {
    return apiRequest<{ data: ApiInventoryItem[] }>('/items');
  },

  async getById(id: string) {
    return apiRequest<{ data: ApiInventoryItem }>(`/items/${id}`);
  },

  async create(data: Partial<ApiInventoryItem>) {
    return apiRequest<{ data: ApiInventoryItem }>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<ApiInventoryItem>) {
    return apiRequest<{ data: ApiInventoryItem }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
    return apiRequest<{ data: DashboardStats }>('/analytics/dashboard');
  },

  async getTrends(period: string = 'month') {
    return apiRequest<{ data: TrendData[] }>(`/analytics/trends?period=${period}`);
  },

  async getReport(type: string) {
    return apiRequest(`/analytics/report?type=${type}`);
  },

  async getAlerts() {
    return apiRequest<{ data: Alert[]; summary: AlertSummary }>('/analytics/alerts');
  },
};

// Health check
export const healthApi = {
  async check() {
    return apiRequest('/health');
  },
};
