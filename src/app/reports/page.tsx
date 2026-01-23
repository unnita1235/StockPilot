'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/use-dashboard';
import { useInventory } from '@/hooks/use-inventory';
import { 
  BarChart3, TrendingUp, Package, AlertTriangle, Download, 
  RefreshCw, DollarSign, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, FileText
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
  const { stats, trends, alerts, alertSummary, loading: statsLoading, refresh: refreshStats } = useDashboard();
  const { items, loading: itemsLoading } = useInventory({ pollInterval: 0 });
  const { toast } = useToast();
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const loading = statsLoading || itemsLoading;

  // Calculate additional metrics
  const lowStockItems = items.filter(item => item.stock <= item.lowStockThreshold);
  const outOfStockItems = items.filter(item => item.stock === 0);
  const categories = [...new Set(items.map(item => item.category))];
  
  // Calculate week-over-week trend
  const weeklyIn = stats?.weeklyActivity?.stockIn || 0;
  const weeklyOut = stats?.weeklyActivity?.stockOut || 0;
  const netChange = weeklyIn - weeklyOut;

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(format);
    try {
      // Export as CSV (client-side for now)
      const headers = ['Name', 'Category', 'Stock', 'Low Stock Threshold', 'Status', 'Unit Price'];
      const rows = items.map(item => [
        `"${item.name}"`,
        item.category,
        item.stock,
        item.lowStockThreshold,
        item.stock === 0 ? 'Out of Stock' : item.stock <= item.lowStockThreshold ? 'Low Stock' : 'In Stock',
        item.unitPrice || 0
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stockpilot-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast({
        title: 'Export Successful',
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Unable to export report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleRefresh = () => {
    refreshStats();
    toast({
      title: 'Refreshed',
      description: 'Report data has been refreshed.',
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
            <h1 className="text-xl font-semibold">Reports & Analytics</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={exporting !== null}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {exporting === 'excel' ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </header>
          <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats?.totalItems || items.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Across {categories.length} categories
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {outOfStockItems.length} out of stock
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold flex items-center gap-1">
                        {netChange >= 0 ? '+' : ''}{netChange}
                        {netChange >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {weeklyIn} in / {weeklyOut} out this week
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        ${(stats?.totalInventoryValue || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total estimated value
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alerts Section */}
            {alertSummary && (alertSummary.critical > 0 || alertSummary.warning > 0) && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {alertSummary.critical > 0 && (
                      <Badge variant="destructive" className="text-sm">
                        {alertSummary.critical} Critical
                      </Badge>
                    )}
                    {alertSummary.warning > 0 && (
                      <Badge variant="secondary" className="text-sm bg-orange-100 text-orange-800">
                        {alertSummary.warning} Warning
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low Stock Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Items that need attention or restocking</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : lowStockItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    🎉 All items are well-stocked!
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-right">Threshold</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.slice(0, 10).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right">{item.stock}</TableCell>
                          <TableCell className="text-right">{item.lowStockThreshold}</TableCell>
                          <TableCell>
                            {item.stock === 0 ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                Low Stock
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Inventory distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const categoryItems = items.filter(i => i.category === category);
                      const percentage = Math.round((categoryItems.length / items.length) * 100);
                      return (
                        <div key={category} className="flex items-center gap-4">
                          <div className="w-32 font-medium truncate">{category}</div>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="w-20 text-right text-sm text-muted-foreground">
                            {categoryItems.length} items ({percentage}%)
                          </div>
                        </div>
                      );
                    })}
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

