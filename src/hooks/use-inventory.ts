'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { InventoryItem, InventoryCategory, initialInventory } from '@/lib/data';
import { itemsApi, stockApi, ApiInventoryItem } from '@/lib/api';

// Transform API item to frontend format
function transformItem(item: ApiInventoryItem): InventoryItem {
  return {
    id: item._id,
    name: item.name,
    description: item.description,
    stock: item.stock,
    category: item.category,
    lowStockThreshold: item.lowStockThreshold,
    sku: item.sku,
    unitPrice: item.unitPrice,
    isLowStock: item.isLowStock,
  };
}

type UseInventoryOptions = {
  pollInterval?: number; // in ms, 0 to disable
};

export function useInventory(options: UseInventoryOptions = {}) {
  const { pollInterval = 10000 } = options; // Default 10s polling

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const lastFetchRef = useRef<number>(0);

  // Fetch all items
  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await itemsApi.getAll();
      const transformedItems = response.data.map(transformItem);
      setItems(transformedItems);
      setIsOnline(true);
      lastFetchRef.current = Date.now();
    } catch (err) {
      // If backend is unavailable, fall back to local data
      if (items.length === 0) {
        setItems(initialInventory);
      }
      setIsOnline(false);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to fetch items');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [items.length]);

  // Add item
  const addItem = useCallback(async (
    itemData: Omit<InventoryItem, 'id'>
  ): Promise<InventoryItem | null> => {
    try {
      if (isOnline) {
        const response = await itemsApi.create({
          name: itemData.name,
          description: itemData.description,
          stock: itemData.stock,
          category: itemData.category,
          lowStockThreshold: itemData.lowStockThreshold,
        });
        const newItem = transformItem(response.data);
        setItems(prev => [newItem, ...prev]);
        return newItem;
      } else {
        // Offline fallback - add locally
        const newItem: InventoryItem = {
          ...itemData,
          id: Date.now().toString(),
        };
        setItems(prev => [newItem, ...prev]);
        return newItem;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    }
  }, [isOnline]);

  // Update item
  const updateItem = useCallback(async (
    id: string,
    itemData: Partial<InventoryItem>
  ): Promise<InventoryItem | null> => {
    try {
      if (isOnline) {
        const response = await itemsApi.update(id, {
          name: itemData.name,
          description: itemData.description,
          category: itemData.category,
          lowStockThreshold: itemData.lowStockThreshold,
        });
        const updatedItem = transformItem(response.data);
        setItems(prev => prev.map(item =>
          item.id === id ? updatedItem : item
        ));
        return updatedItem;
      } else {
        // Offline fallback - update locally
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, ...itemData } : item
        ));
        return items.find(item => item.id === id) || null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  }, [isOnline, items]);

  // Update stock level (quick update)
  const updateStock = useCallback(async (
    id: string,
    newStock: number
  ): Promise<void> => {
    try {
      if (isOnline) {
        const response = await stockApi.quickUpdate(id, newStock);
        const updatedItem = transformItem(response.data);
        setItems(prev => prev.map(item =>
          item.id === id ? updatedItem : item
        ));
      } else {
        // Offline fallback
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, stock: newStock } : item
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
      throw err;
    }
  }, [isOnline]);

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    try {
      if (isOnline) {
        await itemsApi.delete(id);
      }
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  }, [isOnline]);

  // Update threshold
  const updateThreshold = useCallback(async (
    id: string,
    newThreshold: number
  ): Promise<void> => {
    try {
      if (isOnline) {
        await itemsApi.update(id, { lowStockThreshold: newThreshold });
      }
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, lowStockThreshold: newThreshold } : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update threshold');
      throw err;
    }
  }, [isOnline]);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Polling for real-time updates
  useEffect(() => {
    if (pollInterval <= 0 || !isOnline) return;

    const interval = setInterval(() => {
      fetchItems(true); // Silent fetch
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, isOnline, fetchItems]);

  // Refresh function for manual refresh
  const refresh = useCallback(() => {
    return fetchItems(false);
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    isOnline,
    lastFetch: lastFetchRef.current,
    addItem,
    updateItem,
    updateStock,
    deleteItem,
    updateThreshold,
    refresh,
  };
}
