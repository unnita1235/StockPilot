const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage if not provided
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('stockpilot_token') : null);
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Items API
export const itemsApi = {
  getAll: (params?: { category?: string; search?: string; lowStock?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'All') {
      searchParams.set('category', params.category);
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }
    if (params?.lowStock) {
      searchParams.set('lowStock', 'true');
    }
    const query = searchParams.toString();
    return request<{ success: boolean; data: ApiInventoryItem[]; pagination: Pagination }>(
      `/items${query ? `?${query}` : ''}`
    );
  },

  getOne: (id: string) =>
    request<{ success: boolean; data: ApiInventoryItem }>(`/items/${id}`),

  create: (item: CreateItemPayload) =>
    request<{ success: boolean; data: ApiInventoryItem }>('/items', {
      method: 'POST',
      body: item,
    }),

  update: (id: string, item: UpdateItemPayload) =>
    request<{ success: boolean; data: ApiInventoryItem }>(`/items/${id}`, {
      method: 'PUT',
      body: item,
    }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/items/${id}`, {
      method: 'DELETE',
    }),

  getLowStock: () =>
    request<{ success: boolean; data: ApiInventoryItem[]; count: number }>('/items/low-stock'),
};

// Stock API
export const stockApi = {
  addStock: (payload: StockPayload) =>
    request<{ success: boolean; data: StockResult }>('/stock/add', {
      method: 'POST',
      body: payload,
    }),

  removeStock: (payload: StockPayload) =>
    request<{ success: boolean; data: StockResult; warning?: string }>('/stock/remove', {
      method: 'POST',
      body: payload,
    }),

  adjustStock: (payload: AdjustPayload) =>
    request<{ success: boolean; data: StockResult }>('/stock/adjust', {
      method: 'POST',
      body: payload,
    }),

  quickUpdate: (id: string, stock: number) =>
    request<{ success: boolean; data: ApiInventoryItem }>(`/stock/quick-update/${id}`, {
      method: 'PUT',
      body: { stock },
    }),

  getMovements: (itemId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return request<{ success: boolean; data: StockMovement[]; pagination: Pagination }>(
      `/stock/movements/${itemId}${query ? `?${query}` : ''}`
    );
  },

  getRecent: (limit = 20) =>
    request<{ success: boolean; data: StockMovement[] }>(`/stock/movements/recent?limit=${limit}`),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () =>
    request<{ success: boolean; data: DashboardStats }>('/analytics/dashboard'),

  getTrends: (period: '7d' | '30d' | '90d' = '30d') =>
    request<{ success: boolean; data: TrendData[] }>(`/analytics/trends?period=${period}`),

  getForecast: (itemId: string) =>
    request<{ success: boolean; data: ForecastData }>(`/analytics/forecast/${itemId}`),

  getCategories: () =>
    request<{ success: boolean; data: CategoryAnalysis[] }>('/analytics/categories'),

  getTopMovers: (period: '7d' | '30d' = '7d', limit = 10) =>
    request<{ success: boolean; data: TopMover[] }>(`/analytics/top-movers?period=${period}&limit=${limit}`),

  getAlerts: () =>
    request<{ success: boolean; data: Alert[]; summary: AlertSummary }>('/analytics/alerts'),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ success: boolean; data: AuthResult }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (name: string, email: string, password: string) =>
    request<{ success: boolean; data: AuthResult }>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    }),

  getMe: (token: string) =>
    request<{ success: boolean; data: User }>('/auth/me', { token }),
};

// Types
export type InventoryCategory = 'Raw Material' | 'Packaging Material' | 'Product for Sale';

export interface ApiInventoryItem {
  _id: string;
  name: string;
  description: string;
  stock: number;
  category: InventoryCategory;
  lowStockThreshold: number;
  sku?: string;
  unitPrice?: number;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  name: string;
  description?: string;
  stock?: number;
  category: InventoryCategory;
  lowStockThreshold?: number;
  sku?: string;
  unitPrice?: number;
}

export interface UpdateItemPayload {
  name?: string;
  description?: string;
  category?: InventoryCategory;
  lowStockThreshold?: number;
  sku?: string;
  unitPrice?: number;
}

export interface StockPayload {
  itemId: string;
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface AdjustPayload {
  itemId: string;
  newStockLevel: number;
  reason?: string;
}

export interface StockResult {
  movement: StockMovement;
  item: {
    _id: string;
    name: string;
    previousStock: number;
    newStock: number;
  };
}

export interface StockMovement {
  _id: string;
  item: string | { _id: string; name: string; category: string };
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  performedBy?: { _id: string; name: string };
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  lowStockPercentage: number;
  categoryBreakdown: Record<string, { count: number; totalStock: number }>;
  recentMovements: number;
  totalInventoryValue: number;
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
  adjustment: number;
}

export interface ForecastData {
  item: { _id: string; name: string; category: string };
  currentStock: number;
  avgDailyUsage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  daysToStockout: number | null;
  suggestedThreshold: number;
  currentThreshold: number;
  shouldAdjustThreshold: boolean;
  twoWeekForecast: number[];
  projectedStockIn14Days: number;
  historicalUsage: number[];
}

export interface CategoryAnalysis {
  _id: string;
  itemCount: number;
  totalStock: number;
  totalValue: number;
  avgStock: number;
  lowStockCount: number;
}

export interface TopMover {
  _id: string;
  name: string;
  category: string;
  currentStock: number;
  totalMovements: number;
  totalIn: number;
  totalOut: number;
}

export interface Alert {
  type: 'low_stock' | 'slow_moving';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  item: {
    _id: string;
    name: string;
    stock: number;
    threshold?: number;
  };
}

export interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface AuthResult {
  user: User;
  token: string;
}
