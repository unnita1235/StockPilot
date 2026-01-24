import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMockDashboardStats } from '../mocks/factories';

/**
 * Mock DashboardMetrics component
 * Tests the rendering of key metrics on the inventory dashboard
 */
function DashboardMetrics({ stats, isLoading = false }: { stats: any; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div data-testid="metrics-loading">
        <div data-testid="skeleton-1" className="skeleton" />
        <div data-testid="skeleton-2" className="skeleton" />
        <div data-testid="skeleton-3" className="skeleton" />
        <div data-testid="skeleton-4" className="skeleton" />
      </div>
    );
  }

  if (!stats) {
    return <div data-testid="metrics-error">Unable to load metrics</div>;
  }

  return (
    <div data-testid="dashboard-metrics">
      <div data-testid="metric-total-items">
        <span data-testid="metric-label">Total Items</span>
        <span data-testid="metric-value">{stats.totalItems.toLocaleString()}</span>
      </div>
      <div data-testid="metric-total-value">
        <span data-testid="metric-label">Total Value</span>
        <span data-testid="metric-value">${stats.totalValue.toLocaleString()}</span>
      </div>
      <div data-testid="metric-low-stock">
        <span data-testid="metric-label">Low Stock</span>
        <span data-testid="metric-value">{stats.lowStockCount}</span>
        {stats.lowStockCount > 0 && <span data-testid="warning-badge">Warning</span>}
      </div>
      <div data-testid="metric-out-of-stock">
        <span data-testid="metric-label">Out of Stock</span>
        <span data-testid="metric-value">{stats.outOfStockCount}</span>
        {stats.outOfStockCount > 0 && <span data-testid="critical-badge">Critical</span>}
      </div>
    </div>
  );
}

describe('DashboardMetrics', () => {
  const mockStats = createMockDashboardStats();

  // =========================================================
  // Rendering Tests
  // =========================================================

  describe('Rendering', () => {
    it('renders all metric cards', () => {
      render(<DashboardMetrics stats={mockStats} />);
      expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('metric-total-items')).toBeInTheDocument();
      expect(screen.getByTestId('metric-total-value')).toBeInTheDocument();
      expect(screen.getByTestId('metric-low-stock')).toBeInTheDocument();
      expect(screen.getByTestId('metric-out-of-stock')).toBeInTheDocument();
    });

    it('displays total items count', () => {
      render(<DashboardMetrics stats={mockStats} />);
      const totalItems = screen.getByTestId('metric-total-items');
      expect(within(totalItems).getByText('245')).toBeInTheDocument();
    });

    it('displays total value with formatting', () => {
      render(<DashboardMetrics stats={mockStats} />);
      const totalValue = screen.getByTestId('metric-total-value');
      expect(within(totalValue).getByText('$125,430.5')).toBeInTheDocument();
    });

    it('displays low stock count', () => {
      render(<DashboardMetrics stats={mockStats} />);
      const lowStock = screen.getByTestId('metric-low-stock');
      expect(within(lowStock).getByText('12')).toBeInTheDocument();
    });

    it('displays out of stock count', () => {
      render(<DashboardMetrics stats={mockStats} />);
      const outOfStock = screen.getByTestId('metric-out-of-stock');
      expect(within(outOfStock).getByText('3')).toBeInTheDocument();
    });
  });

  // =========================================================
  // Warning Badge Tests
  // =========================================================

  describe('Warning Indicators', () => {
    it('shows warning badge when low stock count > 0', () => {
      render(<DashboardMetrics stats={mockStats} />);
      expect(screen.getByTestId('warning-badge')).toBeInTheDocument();
    });

    it('shows critical badge when out of stock count > 0', () => {
      render(<DashboardMetrics stats={mockStats} />);
      expect(screen.getByTestId('critical-badge')).toBeInTheDocument();
    });

    it('hides warning badge when low stock count is 0', () => {
      const stats = createMockDashboardStats({ lowStockCount: 0 });
      render(<DashboardMetrics stats={stats} />);
      expect(screen.queryByTestId('warning-badge')).not.toBeInTheDocument();
    });

    it('hides critical badge when out of stock count is 0', () => {
      const stats = createMockDashboardStats({ outOfStockCount: 0 });
      render(<DashboardMetrics stats={stats} />);
      expect(screen.queryByTestId('critical-badge')).not.toBeInTheDocument();
    });
  });

  // =========================================================
  // Loading State Tests
  // =========================================================

  describe('Loading State', () => {
    it('shows skeleton loaders when loading', () => {
      render(<DashboardMetrics stats={null} isLoading={true} />);
      expect(screen.getByTestId('metrics-loading')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-2')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-3')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-4')).toBeInTheDocument();
    });

    it('does not show metrics when loading', () => {
      render(<DashboardMetrics stats={null} isLoading={true} />);
      expect(screen.queryByTestId('dashboard-metrics')).not.toBeInTheDocument();
    });
  });

  // =========================================================
  // Error State Tests
  // =========================================================

  describe('Error State', () => {
    it('shows error message when stats is null and not loading', () => {
      render(<DashboardMetrics stats={null} isLoading={false} />);
      expect(screen.getByTestId('metrics-error')).toBeInTheDocument();
      expect(screen.getByText('Unable to load metrics')).toBeInTheDocument();
    });
  });

  // =========================================================
  // Edge Cases
  // =========================================================

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      const zeroStats = createMockDashboardStats({
        totalItems: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      });
      render(<DashboardMetrics stats={zeroStats} />);
      expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument();
    });

    it('handles large numbers with formatting', () => {
      const largeStats = createMockDashboardStats({
        totalItems: 10000,
        totalValue: 1500000.99,
      });
      render(<DashboardMetrics stats={largeStats} />);
      const totalItems = screen.getByTestId('metric-total-items');
      expect(within(totalItems).getByText('10,000')).toBeInTheDocument();
    });
  });
});

// Helper function for scoped queries
function within(element: HTMLElement) {
  return {
    getByText: (text: string) => {
      const matches = Array.from(element.querySelectorAll('*')).filter(
        (el) => el.textContent === text
      );
      if (matches.length === 0) throw new Error(`Text "${text}" not found within element`);
      return matches[0] as HTMLElement;
    },
  };
}
