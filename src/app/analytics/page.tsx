'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/use-dashboard';
import { useInventory } from '@/hooks/use-inventory';
import {
  BarChart3, TrendingUp, Package, AlertTriangle,
  RefreshCw, ArrowUpRight, ArrowDownRight, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const { stats, trends, loading: statsLoading, refresh: refreshStats } = useDashboard({ pollInterval: 60000 });
  const { items, loading: itemsLoading } = useInventory({ pollInterval: 0 });

  const loading = statsLoading || itemsLoading;

  const categoryData = useMemo(() => {
    const breakdown: Record<string, number> = {};
    items.forEach(item => {
      breakdown[item.category] = (breakdown[item.category] || 0) + 1;
    });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [items]);

  const stockDistribution = useMemo(() => {
    let healthy = 0, low = 0, outOfStock = 0;
    items.forEach(item => {
      if (item.stock === 0) outOfStock++;
      else if (item.stock <= item.lowStockThreshold) low++;
      else healthy++;
    });
    return [
      { name: 'Healthy', value: healthy },
      { name: 'Low Stock', value: low },
      { name: 'Out of Stock', value: outOfStock },
    ].filter(d => d.value > 0);
  }, [items]);

  const stockHealthColors = ['#16a34a', '#eab308', '#dc2626'];

  const weeklyIn = stats?.weeklyActivity?.stockIn || 0;
  const weeklyOut = stats?.weeklyActivity?.stockOut || 0;
  const netChange = weeklyIn - weeklyOut;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Analytics</h1>
            </div>
            <Button variant="outline" size="sm" onClick={refreshStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </header>

          <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-20" /> : (
                    <div className="text-2xl font-bold">{stats?.totalItems || items.length}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-20" /> : (
                    <>
                      <div className="text-2xl font-bold text-orange-600">
                        {stats?.lowStockItems || items.filter(i => i.stock <= i.lowStockThreshold).length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats?.lowStockPercentage || 0}% of inventory
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Net Change</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-20" /> : (
                    <div className="text-2xl font-bold flex items-center gap-1">
                      {netChange >= 0 ? '+' : ''}{netChange}
                      {netChange >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-20" /> : (
                    <div className="text-2xl font-bold">
                      ${(stats?.totalInventoryValue || 0).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Stock Activity Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Activity Trend</CardTitle>
                  <CardDescription>Stock in vs stock out over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="in" name="Stock In" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} />
                        <Area type="monotone" dataKey="out" name="Stock Out" stroke="#dc2626" fill="#dc2626" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No trend data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock Health Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Health</CardTitle>
                  <CardDescription>Distribution of stock levels</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : stockDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPie>
                        <Pie
                          data={stockDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {stockDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={stockHealthColors[index % stockHealthColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No items in inventory
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Number of items per category</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Items" fill="#2563eb" radius={[4, 4, 0, 0]}>
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
