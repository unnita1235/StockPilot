/**
 * Mock Data Factories for StockPilot Tests
 *
 * Provides consistent, type-safe test data across all test files.
 * Use factory functions to create mock objects with sensible defaults
 * that can be overridden per test case.
 */

// ============================================================
// Types
// ============================================================

export interface MockUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockInventoryItem {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  category: string;
  location: string;
  lowStockThreshold: number;
  unitPrice: number;
  sku: string;
  barcode: string;
  supplier: string;
  imageUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockStockMovement {
  _id: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason: string;
  notes: string;
  userId: string;
  createdAt: string;
}

export interface MockSupplier {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  contactPerson: string;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  leadTimeDays: number;
  categories: string[];
}

export interface MockDashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCounts: Record<string, number>;
}

export interface MockAlert {
  itemId: string;
  itemName: string;
  currentStock: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface MockAuthResponse {
  user: MockUser;
  token: string;
}

// ============================================================
// Counter for unique IDs
// ============================================================

let idCounter = 0;

function generateId(): string {
  idCounter++;
  return `mock-id-${idCounter.toString().padStart(6, '0')}`;
}

/** Reset ID counter (call in beforeEach if deterministic IDs needed) */
export function resetIdCounter(): void {
  idCounter = 0;
}

// ============================================================
// User Factories
// ============================================================

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    _id: generateId(),
    name: 'Test User',
    email: 'testuser@example.com',
    role: 'staff',
    isActive: true,
    lastLoginAt: '2024-01-15T10:30:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
    ...overrides,
  };
}

export function createMockAdmin(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    ...overrides,
  });
}

export function createMockManager(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    name: 'Manager User',
    email: 'manager@example.com',
    role: 'manager',
    ...overrides,
  });
}

export function createMockUsers(count: number): MockUser[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    })
  );
}

// ============================================================
// Inventory Item Factories
// ============================================================

const CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverage', 'Office Supplies', 'Hardware'];
const LOCATIONS = ['Warehouse A', 'Warehouse B', 'Store Front', 'Back Storage'];

export function createMockItem(overrides: Partial<MockInventoryItem> = {}): MockInventoryItem {
  const id = generateId();
  return {
    _id: id,
    name: 'Test Widget',
    description: 'A high-quality test widget for inventory testing',
    quantity: 100,
    category: 'Electronics',
    location: 'Warehouse A',
    lowStockThreshold: 10,
    unitPrice: 29.99,
    sku: `SKU-${id.slice(-4)}`,
    barcode: `123456789${id.slice(-4)}`,
    supplier: 'Acme Corp',
    imageUrl: '/uploads/test-widget.jpg',
    tags: ['test', 'electronics'],
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-01-15T14:30:00.000Z',
    ...overrides,
  };
}

export function createMockLowStockItem(overrides: Partial<MockInventoryItem> = {}): MockInventoryItem {
  return createMockItem({
    name: 'Low Stock Widget',
    quantity: 3,
    lowStockThreshold: 10,
    ...overrides,
  });
}

export function createMockOutOfStockItem(overrides: Partial<MockInventoryItem> = {}): MockInventoryItem {
  return createMockItem({
    name: 'Out of Stock Widget',
    quantity: 0,
    lowStockThreshold: 5,
    ...overrides,
  });
}

export function createMockItems(count: number): MockInventoryItem[] {
  return Array.from({ length: count }, (_, i) =>
    createMockItem({
      name: `Item ${i + 1}`,
      category: CATEGORIES[i % CATEGORIES.length],
      location: LOCATIONS[i % LOCATIONS.length],
      quantity: Math.floor(Math.random() * 200) + 1,
      unitPrice: parseFloat((Math.random() * 100 + 5).toFixed(2)),
    })
  );
}

// ============================================================
// Stock Movement Factories
// ============================================================

export function createMockMovement(overrides: Partial<MockStockMovement> = {}): MockStockMovement {
  return {
    _id: generateId(),
    itemId: 'item-001',
    type: 'IN',
    quantity: 50,
    reason: 'Supplier delivery',
    notes: 'Regular quarterly restock',
    userId: 'user-001',
    createdAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}

export function createMockMovements(itemId: string, count: number): MockStockMovement[] {
  const types: Array<'IN' | 'OUT' | 'ADJUST'> = ['IN', 'OUT', 'ADJUST'];
  const reasons = ['Supplier delivery', 'Customer order', 'Inventory audit', 'Damaged goods', 'Return'];

  return Array.from({ length: count }, (_, i) =>
    createMockMovement({
      itemId,
      type: types[i % types.length],
      quantity: Math.floor(Math.random() * 50) + 1,
      reason: reasons[i % reasons.length],
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    })
  );
}

// ============================================================
// Supplier Factories
// ============================================================

export function createMockSupplier(overrides: Partial<MockSupplier> = {}): MockSupplier {
  return {
    _id: generateId(),
    name: 'Acme Corporation',
    code: 'ACM-001',
    email: 'orders@acme.com',
    phone: '+1-555-0100',
    contactPerson: 'Jane Smith',
    status: 'active',
    rating: 4.5,
    leadTimeDays: 5,
    categories: ['electronics', 'components'],
    ...overrides,
  };
}

export function createMockSuppliers(count: number): MockSupplier[] {
  const names = ['Acme Corp', 'Global Supplies', 'Tech Parts Inc', 'Wholesale Direct', 'Quick Ship'];
  return Array.from({ length: count }, (_, i) =>
    createMockSupplier({
      name: names[i % names.length],
      code: `SUP-${String(i + 1).padStart(3, '0')}`,
      email: `orders@supplier${i + 1}.com`,
    })
  );
}

// ============================================================
// Dashboard / Analytics Factories
// ============================================================

export function createMockDashboardStats(overrides: Partial<MockDashboardStats> = {}): MockDashboardStats {
  return {
    totalItems: 245,
    totalValue: 125430.5,
    lowStockCount: 12,
    outOfStockCount: 3,
    categoryCounts: {
      Electronics: 85,
      Clothing: 60,
      'Food & Beverage': 50,
      'Office Supplies': 30,
      Hardware: 20,
    },
    ...overrides,
  };
}

export function createMockAlerts(count: number): MockAlert[] {
  return Array.from({ length: count }, (_, i) => ({
    itemId: `item-${i + 1}`,
    itemName: `Alert Item ${i + 1}`,
    currentStock: i,
    threshold: 10,
    severity: (i === 0 ? 'critical' : i < 3 ? 'warning' : 'info') as 'critical' | 'warning' | 'info',
    message: `Item ${i + 1} stock is low (${i}/10)`,
  }));
}

// ============================================================
// Auth Response Factories
// ============================================================

export function createMockAuthResponse(overrides: Partial<MockAuthResponse> = {}): MockAuthResponse {
  return {
    user: createMockUser(),
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9.mock-signature',
    ...overrides,
  };
}

// ============================================================
// WebSocket Event Factories
// ============================================================

export interface MockStockUpdateEvent {
  type: string;
  itemId: string;
  itemName: string;
  previousQuantity: number;
  newQuantity: number;
  userId: string;
  timestamp: string;
}

export function createMockStockUpdateEvent(overrides: Partial<MockStockUpdateEvent> = {}): MockStockUpdateEvent {
  return {
    type: 'stock_added',
    itemId: 'item-001',
    itemName: 'Test Widget',
    previousQuantity: 100,
    newQuantity: 150,
    userId: 'user-001',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export interface MockAlertEvent {
  type: string;
  severity: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  threshold: number;
  message: string;
  timestamp: string;
}

export function createMockAlertEvent(overrides: Partial<MockAlertEvent> = {}): MockAlertEvent {
  return {
    type: 'low_stock',
    severity: 'warning',
    itemId: 'item-002',
    itemName: 'Low Stock Widget',
    currentStock: 3,
    threshold: 10,
    message: 'Low Stock Widget is running low (3/10)',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// API Response Wrappers
// ============================================================

export function wrapApiResponse<T>(data: T, success = true) {
  return {
    success,
    data,
  };
}

export function wrapApiError(message: string, statusCode = 400) {
  return {
    success: false,
    statusCode,
    message,
    error: statusCode === 401 ? 'Unauthorized' : 'Bad Request',
  };
}

// ============================================================
// Fetch Mock Helpers
// ============================================================

export function mockFetchSuccess<T>(data: T): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(wrapApiResponse(data)),
  });
}

export function mockFetchError(message: string, status = 400): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(wrapApiError(message, status)),
  });
}

export function mockFetchNetworkError(): jest.Mock {
  return jest.fn().mockRejectedValue(new Error('Network error'));
}
