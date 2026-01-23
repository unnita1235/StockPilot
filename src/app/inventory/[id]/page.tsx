'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteItemDialog } from '@/components/inventory/delete-item-dialog';
import { useInventory } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/lib/data';
import {
  ArrowLeft, Pencil, Trash2, Package, Tag, BarChart3,
  DollarSign, AlertTriangle, Hash,
} from 'lucide-react';

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { items, loading, deleteItem } = useInventory({ pollInterval: 0 });
  const [showDelete, setShowDelete] = useState(false);

  const itemId = params.id as string;
  const item = items.find(i => i.id === itemId);

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteItem(item.id);
      toast({ title: 'Item Deleted', description: `${item.name} has been removed.`, variant: 'destructive' });
      router.push('/inventory');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Delete failed', variant: 'destructive' });
    }
    setShowDelete(false);
  };

  const getStockBadge = (item: InventoryItem) => {
    if (item.stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (item.stock <= item.lowStockThreshold) return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Low Stock</Badge>;
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  if (loading && !item) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col h-full p-6 gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!item) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Package className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Item Not Found</h2>
            <p className="text-muted-foreground">The item you are looking for does not exist.</p>
            <Button asChild>
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inventory
              </Link>
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/inventory">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl font-semibold truncate">{item.name}</h1>
              {getStockBadge(item)}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/inventory/${item.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </header>

          <main className="flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-auto">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Stock Level Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{item.stock}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Threshold: {item.lowStockThreshold}
                  </p>
                </CardContent>
              </Card>

              {/* Unit Price Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unit Price</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total value: ${((item.unitPrice || 0) * item.stock).toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              {/* Stock Status Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Health</CardTitle>
                  {item.stock <= item.lowStockThreshold ? (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-green-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {item.stock === 0 ? 'Critical' : item.stock <= item.lowStockThreshold ? 'Needs Attention' : 'Healthy'}
                  </div>
                  <div className="mt-2 bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.stock === 0 ? 'bg-red-500' :
                        item.stock <= item.lowStockThreshold ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (item.stock / Math.max(item.lowStockThreshold * 3, 1)) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>Complete information about this inventory item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm mt-1">{item.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm mt-1">{item.description || 'No description provided.'}</p>
                  </div>
                  {item.sku && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SKU</label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {item.sku}
                      </p>
                    </div>
                  )}
                  {item.supplier && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                      <p className="text-sm mt-1">{item.supplier}</p>
                    </div>
                  )}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </main>
        </div>

        {showDelete && (
          <DeleteItemDialog
            open={true}
            onOpenChange={() => setShowDelete(false)}
            onDelete={handleDelete}
            item={item}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
