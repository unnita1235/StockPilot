/** Shared TypeScript types for the StockPilot frontend */

// ============================================
// User & Auth Types
// ============================================

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

export interface User {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  role?: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================
// Inventory Types
// ============================================

export type InventoryCategory = 'Raw Material' | 'Packaging Material' | 'Product for Sale';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  stock: number;
  category: InventoryCategory;
  lowStockThreshold: number;
  sku?: string;
  unitPrice?: number;
  isLowStock?: boolean;
  imageUrl?: string;
  barcode?: string;
  supplier?: string;
  tags?: string[];
}

export interface CreateInventoryItemPayload {
  name: string;
  description?: string;
  quantity: number;
  category: InventoryCategory;
  lowStockThreshold: number;
  unitPrice?: number;
  sku?: string;
  supplier?: string;
}

export interface UpdateInventoryItemPayload {
  name?: string;
  description?: string;
  category?: InventoryCategory;
  lowStockThreshold?: number;
  unitPrice?: number;
  sku?: string;
  supplier?: string;
}

// ============================================
// Stock Movement Types
// ============================================

export type StockMovementType = 'in' | 'out' | 'adjustment';

export interface StockMovement {
  id: string;
  itemId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  notes?: string;
  userId: string;
  createdAt: string;
}

// ============================================
// Analytics Types
// ============================================

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  lowStockPercentage: number;
  categoryBreakdown: Record<string, number>;
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

// ============================================
// Audit Log Types
// ============================================

export interface AuditLog {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  details?: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

// ============================================
// WebSocket Event Types
// ============================================

export interface StockUpdateEvent {
  type: 'stock_added' | 'stock_removed' | 'stock_adjusted' | 'item_created' | 'item_deleted';
  itemId: string;
  itemName: string;
  previousQuantity?: number;
  newQuantity?: number;
  userId: string;
  userName?: string;
  timestamp: string;
}

export interface AlertEvent {
  type: 'low_stock' | 'out_of_stock' | 'restock_needed';
  severity: 'info' | 'warning' | 'critical';
  itemId: string;
  itemName: string;
  currentStock: number;
  threshold: number;
  message: string;
  timestamp: string;
}

export interface NotificationEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: AlertSummary;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
}
