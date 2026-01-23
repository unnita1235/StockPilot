'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ItemFormDialog } from '@/components/inventory/item-form-dialog';
import { DeleteItemDialog } from '@/components/inventory/delete-item-dialog';
import { useInventory } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem, InventoryCategory, categories } from '@/lib/data';
import {
  Search, Plus, RefreshCw, Package, Eye, Pencil, Trash2,
} from 'lucide-react';

export default function InventoryPage() {
  const {
    items, loading, isOnline, addItem, updateItem, deleteItem, refresh,
  } = useInventory({ pollInterval: 30000 });
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => activeCategory === 'All' || item.category === activeCategory)
      .filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [items, searchQuery, activeCategory]);

  const handleSaveItem = async (itemData: Omit<InventoryItem, 'id'> & { id?: string }) => {
    try {
      await addItem(itemData);
      toast({ title: 'Item Added', description: `${itemData.name} has been added.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to add item', variant: 'destructive' });
    }
    setShowAddDialog(false);
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.id);
      toast({ title: 'Item Deleted', description: `${deleteTarget.name} has been removed.`, variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Delete failed', variant: 'destructive' });
    }
    setDeleteTarget(null);
  };

  const getStockBadge = (item: InventoryItem) => {
    if (item.stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (item.stock <= item.lowStockThreshold) return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Low Stock</Badge>;
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Inventory</h1>
              <Badge variant="secondary">{filteredItems.length} items</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </header>

          <main className="flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-auto">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={activeCategory} onValueChange={setActiveCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items Table */}
            {loading && items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-semibold">No items found</h3>
                  <p className="text-sm">Try adjusting your search or filters.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {item.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.stock}</TableCell>
                          <TableCell className="text-right">
                            {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>{getStockBadge(item)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/inventory/${item.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/inventory/${item.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </main>
        </div>

        {showAddDialog && (
          <ItemFormDialog open={true} onOpenChange={() => setShowAddDialog(false)} onSave={handleSaveItem} />
        )}
        {deleteTarget && (
          <DeleteItemDialog
            open={true}
            onOpenChange={() => setDeleteTarget(null)}
            onDelete={handleDeleteItem}
            item={deleteTarget}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
