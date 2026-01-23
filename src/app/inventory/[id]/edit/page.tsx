'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useInventory } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/data';
import { ArrowLeft, Save, Loader2, Package } from 'lucide-react';

export default function EditInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { items, loading, updateItem } = useInventory({ pollInterval: 0 });
  const [saving, setSaving] = useState(false);

  const itemId = params.id as string;
  const item = items.find(i => i.id === itemId);

  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || '');
  const [lowStockThreshold, setLowStockThreshold] = useState(item?.lowStockThreshold?.toString() || '5');
  const [unitPrice, setUnitPrice] = useState(item?.unitPrice?.toString() || '');
  const [sku, setSku] = useState(item?.sku || '');

  // Update form fields when item loads
  if (item && !name && !saving) {
    setName(item.name);
    setDescription(item.description);
    setCategory(item.category);
    setLowStockThreshold(item.lowStockThreshold.toString());
    setUnitPrice(item.unitPrice?.toString() || '');
    setSku(item.sku || '');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setSaving(true);
    try {
      await updateItem(item.id, {
        name,
        description,
        category: category as any,
        lowStockThreshold: parseInt(lowStockThreshold) || 5,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        sku: sku || undefined,
      });
      toast({ title: 'Item Updated', description: `${name} has been updated.` });
      router.push(`/inventory/${item.id}`);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Update failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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
                <Link href={`/inventory/${item.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">Edit Item</h1>
            </div>
          </header>

          <main className="flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-auto">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Edit {item.name}</CardTitle>
                <CardDescription>Update the item details below</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      disabled={saving}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory} disabled={saving}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="threshold">Low Stock Threshold</Label>
                      <Input
                        id="threshold"
                        type="number"
                        min="0"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Unit Price ($)</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="0.00"
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Optional"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href={`/inventory/${item.id}`}>Cancel</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
