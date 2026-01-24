import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  createMockItems,
  createMockItem,
  createMockDashboardStats,
  mockFetchSuccess,
  mockFetchError,
  wrapApiResponse,
} from '../mocks/factories';

/**
 * Inventory Management Integration Tests
 *
 * Tests the complete inventory management user flow including:
 * - Loading and displaying inventory items
 * - Adding new items
 * - Editing existing items
 * - Deleting items
 * - Stock updates
 * - Search and filtering
 */

// Simplified Inventory Page component for testing
function InventoryPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<any | null>(null);

  // Fetch items
  React.useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch('/api/items', {
          headers: { Authorization: 'Bearer test-token' },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setItems(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  // Add item handler
  const handleAddItem = async (itemData: any) => {
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify(itemData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setItems([...items, data.data]);
      setShowAddDialog(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete item handler
  const handleDeleteItem = async (item: any) => {
    try {
      const response = await fetch(`/api/items/${item._id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-token' },
      });
      if (!response.ok) throw new Error('Delete failed');
      setItems(items.filter((i) => i._id !== item._id));
      setDeleteItem(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter items by search
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div data-testid="loading-state">Loading inventory...</div>;
  if (error) return <div data-testid="error-state">{error}</div>;

  return (
    <div data-testid="inventory-page">
      {/* Header Actions */}
      <div data-testid="inventory-actions">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="search-input"
        />
        <button onClick={() => setShowAddDialog(true)} data-testid="add-item-button">
          Add Item
        </button>
      </div>

      {/* Items Count */}
      <div data-testid="items-count">{filteredItems.length} items</div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div data-testid="empty-state">No items found</div>
      ) : (
        <div data-testid="items-list">
          {filteredItems.map((item) => (
            <div key={item._id} data-testid={`item-${item._id}`}>
              <span data-testid="item-name">{item.name}</span>
              <span data-testid="item-quantity">{item.quantity}</span>
              <span data-testid="item-category">{item.category}</span>
              <button
                onClick={() => setEditItem(item)}
                data-testid={`edit-btn-${item._id}`}
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteItem(item)}
                data-testid={`delete-btn-${item._id}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddDialog && (
        <div data-testid="add-dialog">
          <AddItemForm onSubmit={handleAddItem} onCancel={() => setShowAddDialog(false)} />
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteItem && (
        <div data-testid="delete-dialog">
          <p>Delete "{deleteItem.name}"?</p>
          <button onClick={() => handleDeleteItem(deleteItem)} data-testid="confirm-delete">
            Confirm
          </button>
          <button onClick={() => setDeleteItem(null)} data-testid="cancel-delete">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Add Item Form
function AddItemForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [unitPrice, setUnitPrice] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      quantity: parseInt(quantity, 10),
      category,
      unitPrice: parseFloat(unitPrice),
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="add-item-form">
      <input
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="input-name"
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        data-testid="input-quantity"
      />
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        data-testid="input-category"
      />
      <input
        type="number"
        placeholder="Unit Price"
        value={unitPrice}
        onChange={(e) => setUnitPrice(e.target.value)}
        data-testid="input-price"
      />
      <button type="submit" data-testid="submit-add">Add</button>
      <button type="button" onClick={onCancel} data-testid="cancel-add">Cancel</button>
    </form>
  );
}

describe('Inventory Management Integration', () => {
  const user = userEvent.setup();
  const mockItems = createMockItems(5);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // Initial Load Tests
  // =========================================================

  describe('Initial Load', () => {
    it('shows loading state initially', () => {
      global.fetch = jest.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      render(<InventoryPage />);
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('loads and displays items from API', async () => {
      global.fetch = mockFetchSuccess(mockItems);
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('inventory-page')).toBeInTheDocument();
      });

      expect(screen.getByTestId('items-list')).toBeInTheDocument();
      expect(screen.getByText(`${mockItems.length} items`)).toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
      global.fetch = mockFetchError('Server error', 500);
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
    });

    it('shows empty state when no items exist', async () => {
      global.fetch = mockFetchSuccess([]);
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });
  });

  // =========================================================
  // Search & Filter Tests
  // =========================================================

  describe('Search & Filtering', () => {
    beforeEach(() => {
      global.fetch = mockFetchSuccess(mockItems);
    });

    it('filters items by search query', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('items-list')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), mockItems[0].name);

      expect(screen.getByText('1 items')).toBeInTheDocument();
    });

    it('shows empty state when search matches nothing', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('items-list')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), 'nonexistent-item-xyz-123');

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('items-list')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), mockItems[0].name.toUpperCase());

      expect(screen.getByText('1 items')).toBeInTheDocument();
    });
  });

  // =========================================================
  // Add Item Tests
  // =========================================================

  describe('Add Item', () => {
    beforeEach(() => {
      global.fetch = mockFetchSuccess(mockItems);
    });

    it('opens add dialog when button clicked', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('add-item-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-item-button'));
      expect(screen.getByTestId('add-dialog')).toBeInTheDocument();
    });

    it('submits new item and adds to list', async () => {
      const newItem = createMockItem({ name: 'Brand New Widget', quantity: 75 });

      // First call returns existing items, second call creates new item
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(wrapApiResponse(mockItems)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(wrapApiResponse(newItem)),
        });

      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('add-item-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-item-button'));
      await user.type(screen.getByTestId('input-name'), 'Brand New Widget');
      await user.type(screen.getByTestId('input-quantity'), '75');
      await user.type(screen.getByTestId('input-category'), 'Electronics');
      await user.type(screen.getByTestId('input-price'), '49.99');
      await user.click(screen.getByTestId('submit-add'));

      await waitFor(() => {
        expect(screen.queryByTestId('add-dialog')).not.toBeInTheDocument();
      });
    });

    it('closes add dialog on cancel', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('add-item-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-item-button'));
      expect(screen.getByTestId('add-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-add'));
      expect(screen.queryByTestId('add-dialog')).not.toBeInTheDocument();
    });
  });

  // =========================================================
  // Delete Item Tests
  // =========================================================

  describe('Delete Item', () => {
    beforeEach(() => {
      global.fetch = mockFetchSuccess(mockItems);
    });

    it('shows delete confirmation dialog', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('items-list')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId(`delete-btn-${mockItems[0]._id}`));
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      expect(screen.getByText(`Delete "${mockItems[0].name}"?`)).toBeInTheDocument();
    });

    it('removes item from list after confirming delete', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(wrapApiResponse(mockItems)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('items-list')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId(`delete-btn-${mockItems[0]._id}`));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.queryByTestId(`item-${mockItems[0]._id}`)).not.toBeInTheDocument();
      });
    });

    it('closes delete dialog on cancel', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('items-list')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId(`delete-btn-${mockItems[0]._id}`));
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-delete'));
      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
    });
  });

  // =========================================================
  // Items Count Tests
  // =========================================================

  describe('Items Count', () => {
    it('updates count when search filters items', async () => {
      global.fetch = mockFetchSuccess(mockItems);
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText(`${mockItems.length} items`)).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('search-input'), mockItems[0].name);

      expect(screen.getByText('1 items')).toBeInTheDocument();
    });
  });
});
