// Production API URL - MUST be set in environment variables for production
const API_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '' // Will cause errors if not configured - this is intentional
    : 'http://localhost:5000/api'
);

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
  totalStockIn?: number;
  totalStockOut?: number;
  lastRestockDate?: string;
  lastSaleDate?: string;
}

// Stock movement types
export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
export type MovementReason = 
  | 'purchase' 
  | 'sale' 
  | 'return' 
  | 'damaged' 
  | 'expired' 
  | 'theft' 
  | 'correction' 
  | 'transfer' 
  | 'initial_stock'
  | 'quick_update'
  | 'other';

export interface StockMovement {
  _id: string;
  itemId: {
    _id: string;
    name: string;
    sku?: string;
    category?: string;
  } | string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  type: MovementType;
  quantity: number;
  reason: MovementReason;
  notes?: string;
  previousQuantity: number;
  newQuantity: number;
  referenceNumber?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface StockOperationResult {
  movement: StockMovement;
  item: ApiInventoryItem;
  previousQuantity: number;
  newQuantity: number;
}

export interface StockHistoryEntry {
  action: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  userId: string;
  reason: string;
  notes?: string;
  timestamp: string;
}

export interface ItemStockHistory {
  recentHistory: StockHistoryEntry[];
  movements: StockMovement[];
}

export interface ItemStockStats {
  currentStock: number;
  totalStockIn: number;
  totalStockOut: number;
  inTransactions: number;
  outTransactions: number;
  averageDailyUsage: number;
  daysUntilStockout: number;
  recentActivity: {
    _id: string;
    totalIn: number;
    totalOut: number;
  }[];
  lastRestockDate?: string;
  lastSaleDate?: string;
}

export interface MovementFilters {
  itemId?: string;
  userId?: string;
  type?: MovementType;
  reason?: MovementReason;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
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
  /**
   * Add stock to an item
   */
  async addStock(
    itemId: string, 
    quantity: number, 
    reason: MovementReason, 
    notes: string = '',
    options?: { referenceNumber?: string; metadata?: Record<string, any> }
  ) {
    return apiRequest<ApiResponse<StockOperationResult>>('/stock/add', {
      method: 'POST',
      body: JSON.stringify({ 
        itemId, 
        quantity, 
        reason, 
        notes,
        referenceNumber: options?.referenceNumber,
        metadata: options?.metadata,
      }),
    });
  },

  /**
   * Remove stock from an item
   */
  async removeStock(
    itemId: string, 
    quantity: number, 
    reason: MovementReason, 
    notes: string = '',
    options?: { referenceNumber?: string; metadata?: Record<string, any> }
  ) {
    return apiRequest<ApiResponse<StockOperationResult>>('/stock/remove', {
      method: 'POST',
      body: JSON.stringify({ 
        itemId, 
        quantity, 
        reason, 
        notes,
        referenceNumber: options?.referenceNumber,
        metadata: options?.metadata,
      }),
    });
  },

  /**
   * Adjust stock (positive or negative correction)
   */
  async adjustStock(
    itemId: string,
    adjustment: number,
    reason: MovementReason = 'correction',
    notes: string = '',
    referenceNumber?: string
  ) {
    return apiRequest<ApiResponse<StockOperationResult>>('/stock/adjust', {
      method: 'POST',
      body: JSON.stringify({ itemId, adjustment, reason, notes, referenceNumber }),
    });
  },

  /**
   * Bulk add stock to multiple items in one transaction
   */
  async bulkAddStock(operations: {
    itemId: string;
    quantity: number;
    reason: MovementReason;
    notes?: string;
    referenceNumber?: string;
  }[]) {
    return apiRequest<ApiResponse<StockOperationResult[]>>('/stock/bulk-add', {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });
  },

  /**
   * Get stock movements with filtering and pagination
   */
  async getMovements(filters?: MovementFilters) {
    const params = new URLSearchParams();
    if (filters?.itemId) params.append('itemId', filters.itemId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.reason) params.append('reason', filters.reason);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/stock/movements?${queryString}` : '/stock/movements';
    
    return apiRequest<ApiResponse<StockMovement[]>>(endpoint);
  },

  /**
   * Get stock history for a specific item
   */
  async getItemHistory(itemId: string, limit?: number) {
    const endpoint = limit 
      ? `/stock/history/${itemId}?limit=${limit}` 
      : `/stock/history/${itemId}`;
    return apiRequest<ApiResponse<ItemStockHistory>>(endpoint);
  },

  /**
   * Get stock statistics for a specific item
   */
  async getItemStats(itemId: string) {
    return apiRequest<ApiResponse<ItemStockStats>>(`/stock/stats/${itemId}`);
  },

  /**
   * Quick update stock (simple adjustment)
   */
  async quickUpdate(id: string, stock: number) {
    return apiRequest<ApiResponse<ApiInventoryItem>>(`/stock/quick-update/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    });
  },
};

// Analytics types
export interface InventoryReportItem {
  _id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  totalStockIn: number;
  totalStockOut: number;
  turnoverRate: number;
}

export interface ValuationCategory {
  category: string;
  itemCount: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
  averageItemValue: number;
}

export interface ValuationReport {
  categories: ValuationCategory[];
  totals: {
    totalItems: number;
    totalUnits: number;
    totalValue: number;
    totalLowStock: number;
  };
  generatedAt: string;
}

export interface MovementReportSummary {
  byType: Record<string, { quantity: number; count: number }>;
  byReason: Record<string, { quantity: number; count: number }>;
  totalMovements: number;
}

export interface MovementReport {
  movements: StockMovement[];
  summary: MovementReportSummary;
  generatedAt: string;
}

export interface TurnoverItem {
  _id: string;
  name: string;
  category?: string;
  currentStock: number;
  stockIn: number;
  stockOut: number;
  dailyUsage: number;
  daysUntilStockout: number | null;
  turnoverRate: number;
  velocity: 'fast' | 'slow' | 'stable';
}

export interface TurnoverAnalysis {
  items: TurnoverItem[];
  summary: {
    fastMovingCount: number;
    slowMovingCount: number;
    stableCount: number;
    averageTurnover: number;
  };
  period: string;
  generatedAt: string;
}

export interface EnhancedDashboardStats extends DashboardStats {
  outOfStockItems: number;
  categoryValues: Record<string, number>;
  totalMovements: number;
  totalUnits: number;
  monthlyActivity: {
    stockIn: number;
    stockOut: number;
    movementsIn: number;
    movementsOut: number;
    netChange: number;
  };
  topItemsByValue: {
    _id: string;
    name: string;
    value: number;
    quantity: number;
  }[];
  criticalItems: {
    _id: string;
    name: string;
    quantity: number;
    threshold: number;
    urgency: 'critical' | 'high' | 'medium';
  }[];
}

// Analytics endpoints
export const analyticsApi = {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboard() {
    const response = await apiRequest<ApiResponse<EnhancedDashboardStats>>('/analytics/dashboard');
    return response;
  },

  /**
   * Get trends with configurable period
   */
  async getTrends(period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'week') {
    const response = await apiRequest<ApiResponse<TrendData[]>>(`/analytics/trends?period=${period}`);
    return response;
  },

  /**
   * Get low stock alerts
   */
  async getAlerts() {
    const response = await apiRequest<ApiResponse<Alert[]>>('/analytics/alerts');
    return { data: response.data, summary: response.summary! };
  },

  /**
   * Get inventory report
   */
  async getInventoryReport(category?: string) {
    const endpoint = category 
      ? `/analytics/report/inventory?category=${encodeURIComponent(category)}`
      : '/analytics/report/inventory';
    return apiRequest<ApiResponse<InventoryReportItem[]>>(endpoint);
  },

  /**
   * Get valuation report
   */
  async getValuationReport() {
    return apiRequest<ApiResponse<ValuationReport>>('/analytics/report/valuation');
  },

  /**
   * Get movement report
   */
  async getMovementReport(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const endpoint = queryString 
      ? `/analytics/report/movements?${queryString}` 
      : '/analytics/report/movements';
    return apiRequest<ApiResponse<MovementReport>>(endpoint);
  },

  /**
   * Get turnover analysis
   */
  async getTurnoverAnalysis(days: number = 30) {
    return apiRequest<ApiResponse<TurnoverAnalysis>>(`/analytics/report/turnover?days=${days}`);
  },

  /**
   * Legacy report endpoint
   */
  async getReport(type: 'inventory' | 'valuation' | 'turnover') {
    return apiRequest(`/analytics/report?type=${type}`);
  },

  /**
   * Get CSV export URL for inventory report
   */
  getInventoryExportUrl(category?: string): string {
    const base = `${API_URL}/analytics/export/inventory/csv`;
    return category ? `${base}?category=${encodeURIComponent(category)}` : base;
  },

  /**
   * Get CSV export URL for valuation report
   */
  getValuationExportUrl(): string {
    return `${API_URL}/analytics/export/valuation/csv`;
  },

  /**
   * Get CSV export URL for movements report
   */
  getMovementsExportUrl(startDate?: string, endDate?: string): string {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return queryString 
      ? `${API_URL}/analytics/export/movements/csv?${queryString}`
      : `${API_URL}/analytics/export/movements/csv`;
  },

  /**
   * Get CSV export URL for turnover analysis
   */
  getTurnoverExportUrl(days: number = 30): string {
    return `${API_URL}/analytics/export/turnover/csv?days=${days}`;
  },
};

// Health check
export const healthApi = {
  async check() {
    return apiRequest('/health');
  },
};

// AI Forecasting types
export interface DemandPrediction {
  itemId: string;
  itemName: string;
  currentStock: number;
  predictedDemand7Days: number;
  predictedDemand30Days: number;
  predictedDemand90Days: number;
  confidenceScore: number;
  recommendedReorderPoint: number;
  recommendedReorderQuantity: number;
  nextRestockDate: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  insights: string[];
}

export interface OptimizationRecommendation {
  itemId: string;
  itemName: string;
  type: 'reorder' | 'reduce' | 'discontinue' | 'promote';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestedAction: string;
  potentialSavings?: number;
}

export interface InventoryOptimization {
  totalItems: number;
  optimizationScore: number;
  recommendations: OptimizationRecommendation[];
  summary: {
    itemsNeedingReorder: number;
    overstockedItems: number;
    slowMovingItems: number;
    healthyItems: number;
  };
}

// AI endpoints
export const aiApi = {
  /**
   * Predict demand for a specific item
   */
  async predictDemand(itemId: string) {
    return apiRequest<ApiResponse<DemandPrediction>>(`/ai/predict/${itemId}`);
  },

  /**
   * Batch predict demand for all items
   */
  async batchPredictDemand() {
    return apiRequest<ApiResponse<DemandPrediction[]>>('/ai/predict-all');
  },

  /**
   * Get AI-powered inventory optimization recommendations
   */
  async getOptimizationRecommendations() {
    return apiRequest<ApiResponse<InventoryOptimization>>('/ai/optimize');
  },
};

// Supplier types
export interface Supplier {
  _id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  contactPerson?: string;
  website?: string;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  leadTimeDays: number;
  minimumOrderValue: number;
  categories: string[];
  notes?: string;
  paymentTerms?: {
    method?: string;
    netDays?: number;
    currency?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFilters {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

// Suppliers endpoints
export const suppliersApi = {
  async getAll(filters?: SupplierFilters) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';
    return apiRequest<ApiResponse<Supplier[]>>(endpoint);
  },

  async getById(id: string) {
    return apiRequest<ApiResponse<Supplier>>(`/suppliers/${id}`);
  },

  async getActive() {
    return apiRequest<ApiResponse<Supplier[]>>('/suppliers/active');
  },

  async getByCategory(category: string) {
    return apiRequest<ApiResponse<Supplier[]>>(`/suppliers/by-category/${encodeURIComponent(category)}`);
  },

  async create(data: Partial<Supplier>) {
    return apiRequest<ApiResponse<Supplier>>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Supplier>) {
    return apiRequest<ApiResponse<Supplier>>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiRequest<ApiResponse<null>>(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};

// WebSocket connection helper
export const createWebSocketConnection = () => {
  if (typeof window === 'undefined') return null;
  
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || (
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? '' // Must be configured for production
      : 'http://localhost:5000/ws'
  );
  
  // Dynamic import for socket.io-client
  return import('socket.io-client').then(({ io }) => {
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    return {
      socket,
      
      authenticate: (userId: string, role: string) => {
        socket.emit('authenticate', { userId, role });
      },

      subscribeToItem: (itemId: string) => {
        socket.emit('subscribe_item', itemId);
      },

      unsubscribeFromItem: (itemId: string) => {
        socket.emit('unsubscribe_item', itemId);
      },

      onStockUpdate: (callback: (data: any) => void) => {
        socket.on('stock_update', callback);
        return () => socket.off('stock_update', callback);
      },

      onAlert: (callback: (data: any) => void) => {
        socket.on('alert', callback);
        return () => socket.off('alert', callback);
      },

      onNotification: (callback: (data: any) => void) => {
        socket.on('notification', callback);
        return () => socket.off('notification', callback);
      },

      onDashboardUpdate: (callback: (data: any) => void) => {
        socket.on('dashboard_update', callback);
        return () => socket.off('dashboard_update', callback);
      },

      disconnect: () => {
        socket.disconnect();
      },
    };
  });
};

// Notifications endpoints
export const notificationsApi = {
  async sendTestNotification(message?: string) {
    return apiRequest<ApiResponse<null>>('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async sendTestEmail(email: string) {
    return apiRequest<ApiResponse<{ success: boolean }>>('/notifications/test-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};
