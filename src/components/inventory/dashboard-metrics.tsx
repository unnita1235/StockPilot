'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { DashboardStats } from '@/lib/api';

type DashboardMetricsProps = {
  stats: DashboardStats | null;
  loading?: boolean;
};

export function DashboardMetrics({ stats, loading }: DashboardMetricsProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Items',
      value: stats.totalItems,
      description: `Across ${Object.keys(stats.categoryBreakdown).length} categories`,
      icon: Package,
      trend: null,
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      description: `${stats.lowStockPercentage}% of inventory`,
      icon: AlertTriangle,
      trend: null,
      alert: stats.lowStockItems > 0,
    },
    {
      title: 'Weekly Stock In',
      value: stats.weeklyActivity.stockIn,
      description: `${stats.weeklyActivity.movementsIn} transactions`,
      icon: TrendingUp,
      trend: 'up',
    },
    {
      title: 'Weekly Stock Out',
      value: stats.weeklyActivity.stockOut,
      description: `${stats.weeklyActivity.movementsOut} transactions`,
      icon: TrendingDown,
      trend: 'down',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon
              className={`h-4 w-4 ${
                metric.alert
                  ? 'text-destructive'
                  : metric.trend === 'up'
                    ? 'text-green-500'
                    : metric.trend === 'down'
                      ? 'text-orange-500'
                      : 'text-muted-foreground'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.alert ? 'text-destructive' : ''}`}>
              {metric.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
