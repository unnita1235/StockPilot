import { render, screen } from '@testing-library/react';
import { InventoryTable } from '@/components/inventory/inventory-table';
import type { InventoryItem } from '@/lib/data';

const mockItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Test Item 1',
    description: 'Test Description 1',
    stock: 10,
    category: 'Raw Material',
    lowStockThreshold: 5,
    isLowStock: false,
  },
  {
    id: '2',
    name: 'Test Item 2',
    description: 'Test Description 2',
    stock: 3,
    category: 'Product for Sale',
    lowStockThreshold: 5,
    isLowStock: true,
  },
];

const mockHandlers = {
  onEditItem: jest.fn(),
  onDeleteItem: jest.fn(),
  onAnalyzeItem: jest.fn(),
};

describe('InventoryTable', () => {
  it('renders items correctly', () => {
    render(<InventoryTable items={mockItems} {...mockHandlers} />);

    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
  });

  it('displays low stock badge for items below threshold', () => {
    render(<InventoryTable items={mockItems} {...mockHandlers} />);

    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('displays stock levels', () => {
    render(<InventoryTable items={mockItems} {...mockHandlers} />);

    expect(screen.getByText('10 units')).toBeInTheDocument();
    expect(screen.getByText('3 units')).toBeInTheDocument();
  });

  it('displays categories', () => {
    render(<InventoryTable items={mockItems} {...mockHandlers} />);

    expect(screen.getByText('Raw Material')).toBeInTheDocument();
    expect(screen.getByText('Product for Sale')).toBeInTheDocument();
  });
});

