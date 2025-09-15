export type InventoryCategory = 'Raw Material' | 'Packaging Material' | 'Product for Sale';

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  stock: number;
  category: InventoryCategory;
  lowStockThreshold: number;
};

export const categories: InventoryCategory[] = ['Raw Material', 'Packaging Material', 'Product for Sale'];

export const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Premium Coffee Beans', description: '1kg bag of Arabica beans from Colombia.', stock: 15, category: 'Raw Material', lowStockThreshold: 10 },
  { id: '2', name: 'Branded Coffee Cups', description: 'Pack of 100 12oz disposable cups.', stock: 80, category: 'Packaging Material', lowStockThreshold: 50 },
  { id: '3', name: 'House Blend Drip Coffee', description: 'Ready-to-sell 12oz cup of coffee.', stock: 100, category: 'Product for Sale', lowStockThreshold: 20 },
  { id: '4', name: 'Organic Milk', description: '1 gallon of whole milk.', stock: 5, category: 'Raw Material', lowStockThreshold: 4 },
  { id: '5', name: 'Cardboard Sleeves', description: 'Pack of 100 sleeves for hot cups.', stock: 35, category: 'Packaging Material', lowStockThreshold: 40 },
  { id: '6', name: 'Chocolate Croissant', description: 'Freshly baked daily.', stock: 12, category: 'Product for Sale', lowStockThreshold: 5 },
  { id: '7', name: 'Espresso Machine Cleaner', description: '500g cleaning powder.', stock: 8, category: 'Raw Material', lowStockThreshold: 5 },
  { id: '8', name: 'Paper Bags', description: 'Pack of 50 for takeaway orders.', stock: 60, category: 'Packaging Material', lowStockThreshold: 30 },
  { id: '9', name: 'Vanilla Syrup', description: '1L bottle of flavoring syrup.', stock: 9, category: 'Raw Material', lowStockThreshold: 10 },
  { id: '10', name: 'Gift Card', description: '$25 physical gift card.', stock: 45, category: 'Product for Sale', lowStockThreshold: 15 },
];
