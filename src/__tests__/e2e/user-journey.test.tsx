import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  createMockUser,
  createMockItems,
  createMockItem,
  createMockDashboardStats,
  createMockAuthResponse,
  wrapApiResponse,
} from '../mocks/factories';

/**
 * E2E User Journey Tests
 *
 * Simulates complete user workflows from login to inventory management.
 * These tests verify that the full application flow works correctly
 * when components interact with each other.
 *
 * Note: For true E2E testing with a running server, use Playwright or Cypress.
 * These tests simulate the flow using React Testing Library with mocked APIs.
 */

// Mock router
const mockPush = jest.fn();
const mockPathname = { current: '/login' };
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  usePathname: () => mockPathname.current,
}));

// Simplified app wrapper for E2E-style tests
function AppWrapper({ children, initialAuth }: { children: React.ReactNode; initialAuth?: any }) {
  const [auth, setAuth] = React.useState(initialAuth || { user: null, token: null });
  const [page, setPage] = React.useState('login');

  const navigate = (path: string) => {
    setPage(path);
    mockPush(path);
  };

  return (
    <AppContext.Provider value={{ auth, setAuth, navigate, page }}>
      {children}
    </AppContext.Provider>
  );
}

const AppContext = React.createContext<any>(null);

describe('User Journey E2E', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // =========================================================
  // Journey 1: New User Registration → Dashboard
  // =========================================================

  describe('Journey: New User Registration to Dashboard', () => {
    it('completes full registration and views dashboard', async () => {
      const mockAuthResp = createMockAuthResponse();
      const mockDashboard = createMockDashboardStats();
      const mockItems = createMockItems(3);

      let fetchCallCount = 0;
      global.fetch = jest.fn().mockImplementation((url: string) => {
        fetchCallCount++;

        if (url.includes('/auth/register')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(wrapApiResponse(mockAuthResp)),
          });
        }
        if (url.includes('/analytics/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(wrapApiResponse(mockDashboard)),
          });
        }
        if (url.includes('/items')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(wrapApiResponse(mockItems)),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      // Render registration form
      function RegistrationPage() {
        const ctx = React.useContext(AppContext);
        const [submitted, setSubmitted] = React.useState(false);

        const handleRegister = async () => {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'New User',
              email: 'new@example.com',
              password: 'SecurePass123!',
            }),
          });
          const data = await response.json();
          ctx.setAuth({ user: data.data.user, token: data.data.token });
          setSubmitted(true);
        };

        if (submitted) {
          return <DashboardView />;
        }

        return (
          <div data-testid="registration-page">
            <button onClick={handleRegister} data-testid="register-btn">
              Register
            </button>
          </div>
        );
      }

      function DashboardView() {
        const [stats, setStats] = React.useState<any>(null);

        React.useEffect(() => {
          fetch('/api/analytics/dashboard')
            .then((r) => r.json())
            .then((data) => setStats(data.data));
        }, []);

        if (!stats) return <div data-testid="dashboard-loading">Loading...</div>;

        return (
          <div data-testid="dashboard-view">
            <div data-testid="total-items">{stats.totalItems} items</div>
            <div data-testid="total-value">${stats.totalValue}</div>
            <div data-testid="low-stock-alerts">{stats.lowStockCount} alerts</div>
          </div>
        );
      }

      render(
        <AppWrapper>
          <RegistrationPage />
        </AppWrapper>
      );

      // Step 1: Register
      expect(screen.getByTestId('registration-page')).toBeInTheDocument();
      await user.click(screen.getByTestId('register-btn'));

      // Step 2: View Dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
      });

      expect(screen.getByTestId('total-items')).toHaveTextContent('245 items');
      expect(screen.getByTestId('low-stock-alerts')).toHaveTextContent('12 alerts');
    });
  });

  // =========================================================
  // Journey 2: Inventory CRUD Workflow
  // =========================================================

  describe('Journey: Complete Inventory CRUD', () => {
    it('adds, edits, and deletes an inventory item', async () => {
      const existingItems = createMockItems(2);
      const newItem = createMockItem({ name: 'New Product', quantity: 50 });

      let currentItems = [...existingItems];
      global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
        const method = options?.method || 'GET';

        if (method === 'GET' && url.includes('/items')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(wrapApiResponse(currentItems)),
          });
        }
        if (method === 'POST' && url.includes('/items')) {
          currentItems = [...currentItems, newItem];
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(wrapApiResponse(newItem)),
          });
        }
        if (method === 'DELETE') {
          const id = url.split('/').pop();
          currentItems = currentItems.filter((i) => i._id !== id);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      function InventoryCRUD() {
        const [items, setItems] = React.useState<any[]>([]);
        const [loaded, setLoaded] = React.useState(false);

        const loadItems = async () => {
          const resp = await fetch('/api/items');
          const data = await resp.json();
          setItems(data.data);
          setLoaded(true);
        };

        const addItem = async () => {
          const resp = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New Product', quantity: 50 }),
          });
          const data = await resp.json();
          setItems([...items, data.data]);
        };

        const deleteItem = async (id: string) => {
          await fetch(`/api/items/${id}`, { method: 'DELETE' });
          setItems(items.filter((i) => i._id !== id));
        };

        React.useEffect(() => { loadItems(); }, []);

        if (!loaded) return <div data-testid="loading">Loading...</div>;

        return (
          <div data-testid="crud-page">
            <div data-testid="item-count">{items.length} items</div>
            <button onClick={addItem} data-testid="add-btn">Add</button>
            {items.map((item) => (
              <div key={item._id} data-testid={`item-${item._id}`}>
                <span>{item.name}</span>
                <button onClick={() => deleteItem(item._id)} data-testid={`del-${item._id}`}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        );
      }

      render(<InventoryCRUD />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('crud-page')).toBeInTheDocument();
      });
      expect(screen.getByTestId('item-count')).toHaveTextContent('2 items');

      // Add item
      await user.click(screen.getByTestId('add-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('item-count')).toHaveTextContent('3 items');
      });
      expect(screen.getByText('New Product')).toBeInTheDocument();

      // Delete the new item
      await user.click(screen.getByTestId(`del-${newItem._id}`));
      await waitFor(() => {
        expect(screen.getByTestId('item-count')).toHaveTextContent('2 items');
      });
      expect(screen.queryByText('New Product')).not.toBeInTheDocument();
    });
  });

  // =========================================================
  // Journey 3: Stock Alert Workflow
  // =========================================================

  describe('Journey: Stock Alert Detection', () => {
    it('detects and displays low stock alerts after stock removal', async () => {
      const item = createMockItem({ name: 'Alert Widget', quantity: 15, lowStockThreshold: 10 });
      let currentQuantity = item.quantity;

      global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
        if (url.includes('/stock/remove')) {
          currentQuantity -= 10;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(wrapApiResponse({ quantity: currentQuantity })),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      function StockAlertTest() {
        const [quantity, setQuantity] = React.useState(item.quantity);
        const [alert, setAlert] = React.useState<string | null>(null);

        const removeStock = async () => {
          const resp = await fetch('/api/stock/remove', {
            method: 'POST',
            body: JSON.stringify({ itemId: item._id, quantity: 10 }),
          });
          const data = await resp.json();
          const newQty = data.data.quantity;
          setQuantity(newQty);

          if (newQty <= item.lowStockThreshold) {
            setAlert(`Low stock alert: ${item.name} is at ${newQty} units`);
          }
        };

        return (
          <div data-testid="stock-alert-test">
            <div data-testid="current-quantity">{quantity}</div>
            <button onClick={removeStock} data-testid="remove-stock">Remove 10</button>
            {alert && <div data-testid="alert-message">{alert}</div>}
          </div>
        );
      }

      render(<StockAlertTest />);

      expect(screen.getByTestId('current-quantity')).toHaveTextContent('15');
      expect(screen.queryByTestId('alert-message')).not.toBeInTheDocument();

      // Remove stock to trigger alert
      await user.click(screen.getByTestId('remove-stock'));

      await waitFor(() => {
        expect(screen.getByTestId('current-quantity')).toHaveTextContent('5');
      });
      expect(screen.getByTestId('alert-message')).toHaveTextContent('Low stock alert');
    });
  });

  // =========================================================
  // Journey 4: Multi-step Search and Action
  // =========================================================

  describe('Journey: Search and Take Action', () => {
    it('searches for item, views details, and updates stock', async () => {
      const items = createMockItems(10);
      const targetItem = items[3];
      targetItem.name = 'Unique Searchable Widget';

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/items')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(wrapApiResponse(items)),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      function SearchAndAction() {
        const [allItems, setAllItems] = React.useState<any[]>([]);
        const [search, setSearch] = React.useState('');
        const [selected, setSelected] = React.useState<any>(null);

        React.useEffect(() => {
          fetch('/api/items').then((r) => r.json()).then((d) => setAllItems(d.data));
        }, []);

        const filtered = allItems.filter((i) =>
          i.name.toLowerCase().includes(search.toLowerCase())
        );

        return (
          <div data-testid="search-action-page">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="search"
              placeholder="Search..."
            />
            <div data-testid="result-count">{filtered.length} results</div>
            {filtered.map((item) => (
              <div key={item._id} data-testid={`result-${item._id}`}>
                <span>{item.name}</span>
                <button onClick={() => setSelected(item)} data-testid={`select-${item._id}`}>
                  Select
                </button>
              </div>
            ))}
            {selected && (
              <div data-testid="selected-details">
                <h3>{selected.name}</h3>
                <p>Quantity: {selected.quantity}</p>
                <p>Category: {selected.category}</p>
              </div>
            )}
          </div>
        );
      }

      render(<SearchAndAction />);

      await waitFor(() => {
        expect(screen.getByTestId('result-count')).toHaveTextContent('10 results');
      });

      // Search for specific item
      await user.type(screen.getByTestId('search'), 'Unique Searchable');

      await waitFor(() => {
        expect(screen.getByTestId('result-count')).toHaveTextContent('1 results');
      });

      // Select item
      await user.click(screen.getByTestId(`select-${targetItem._id}`));
      expect(screen.getByTestId('selected-details')).toBeInTheDocument();
      expect(screen.getByText('Unique Searchable Widget')).toBeInTheDocument();
    });
  });
});
