import { itemsApi } from '@/lib/api';

// Mock fetch
global.fetch = jest.fn();

describe('Items API', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getAll', () => {
    it('should fetch all items', async () => {
      const mockResponse = {
        success: true,
        data: [
          { _id: '1', name: 'Item 1', stock: 10, category: 'Raw Material', lowStockThreshold: 5 },
        ],
        pagination: { page: 1, limit: 50, total: 1, pages: 1 },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await itemsApi.getAll();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle query parameters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await itemsApi.getAll({ category: 'Raw Material', search: 'coffee' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=Raw%20Material'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=coffee'),
        expect.any(Object)
      );
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const mockItem = {
        name: 'New Item',
        description: 'Description',
        stock: 10,
        category: 'Raw Material' as const,
        lowStockThreshold: 5,
      };

      const mockResponse = {
        success: true,
        data: { _id: '1', ...mockItem },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await itemsApi.create(mockItem);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockItem),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should throw error on failed request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Error message' }),
      });

      await expect(itemsApi.getAll()).rejects.toThrow('Error message');
    });
  });
});

