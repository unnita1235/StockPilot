'use client';

import { useState, useMemo } from 'react';
import { InventoryItem, InventoryCategory } from '@/lib/data';
import { DashboardLayout } from '@/components/dashboard-layout';
import { InventoryActions } from '@/components/inventory/inventory-actions';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { ItemFormDialog } from '@/components/inventory/item-form-dialog';
import { DeleteItemDialog } from '@/components/inventory/delete-item-dialog';
import { LowStockAnalyzerDialog } from '@/components/inventory/low-stock-analyzer-dialog';
import { DashboardMetrics } from '@/components/inventory/dashboard-metrics';
import { StockActivityChart } from '@/components/inventory/stock-activity-chart';
import { useInventory } from '@/hooks/use-inventory';
import { useDashboard } from '@/hooks/use-dashboard';
import { useToast } from '@/hooks/use-toast';
import { Search, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DialogState =
  | { type: 'add' }
  | { type: 'edit'; item: InventoryItem }
  | { type: 'delete'; item: InventoryItem }
  | { type: 'analyze'; item: InventoryItem }
  | { type: 'closed' };

export default function Home() {
  const {
    items: inventory,
    loading,
    isOnline,
    addItem,
    updateItem,
    deleteItem: removeItem,
    updateThreshold,
    refresh: refreshInventory,
  } = useInventory({ pollInterval: 10000 });

  const { stats, trends, loading: statsLoading, refresh: refreshStats } = useDashboard({ pollInterval: 30000 });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<InventoryCategory | 'All'>('All');
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'closed' });
  const { toast } = useToast();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: InventoryCategory | 'All') => {
    setActiveCategory(category);
  };

  const filteredInventory = useMemo(() => {
    return inventory
      .filter((item) => {
        if (activeCategory === 'All') return true;
        return item.category === activeCategory;
      })
      .filter((item) => {
        return (
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
  }, [inventory, searchQuery, activeCategory]);

  const handleOpenDialog = (state: DialogState) => {
    setDialogState(state);
  };

  const handleCloseDialog = () => {
    setDialogState({ type: 'closed' });
  };

  const handleSaveItem = async (itemData: Omit<InventoryItem, 'id'> & { id?: string }) => {
    try {
      if (itemData.id) {
        await updateItem(itemData.id, itemData);
        toast({
          title: 'Item Updated',
          description: `${itemData.name} has been successfully updated.`,
        });
      } else {
        await addItem(itemData);
        toast({
          title: 'Item Added',
          description: `${itemData.name} has been added to your inventory.`,
        });
      }
      refreshStats();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Operation failed',
        variant: 'destructive',
      });
    }
    handleCloseDialog();
  };

  const handleDeleteItem = async (itemId: string) => {
    const itemToDelete = inventory.find(i => i.id === itemId);
    try {
      await removeItem(itemId);
      if (itemToDelete) {
        toast({
          title: 'Item Deleted',
          description: `${itemToDelete.name} has been removed from your inventory.`,
          variant: 'destructive',
        });
      }
      refreshStats();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Delete failed',
        variant: 'destructive',
      });
    }
    handleCloseDialog();
  };

  const handleUpdateThreshold = async (itemId: string, newThreshold: number) => {
    const item = inventory.find(i => i.id === itemId);
    try {
      await updateThreshold(itemId, newThreshold);
      if (item) {
        toast({
          title: 'Threshold Updated',
          description: `Low stock threshold for ${item.name} updated to ${newThreshold}.`,
        });
      }
      refreshStats();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Update failed',
        variant: 'destructive',
      });
    }
    handleCloseDialog();
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'Description', 'Stock', 'Category', 'Low Stock Threshold'];
    const rows = filteredInventory.map(item =>
      [item.id, `"${item.name.replace(/"/g, '""')}"`, `"${item.description.replace(/"/g, '""')}"`, item.stock, item.category, item.lowStockThreshold].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'stockpilot_inventory.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Export Successful',
      description: 'Your inventory data has been exported to CSV.',
    });
  };

  const handleRefresh = () => {
    refreshInventory();
    refreshStats();
    toast({
      title: 'Refreshed',
      description: 'Data has been refreshed.',
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
          <h1 className="text-xl font-semibold">Inventory</h1>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>
        <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6">
          <DashboardMetrics stats={stats} loading={statsLoading} />

          <div className="grid gap-4 md:grid-cols-2">
            <StockActivityChart data={trends} loading={statsLoading} />
          </div>

          <InventoryActions
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            activeCategory={activeCategory}
            onAddItem={() => handleOpenDialog({ type: 'add' })}
            onExport={handleExportCsv}
          />

          {loading && inventory.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInventory.length > 0 ? (
            <InventoryTable
              items={filteredInventory}
              onEditItem={(item) => handleOpenDialog({ type: 'edit', item })}
              onDeleteItem={(item) => handleOpenDialog({ type: 'delete', item })}
              onAnalyzeItem={(item) => handleOpenDialog({ type: 'analyze', item })}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Search className="h-12 w-12" />
                <h3 className="text-2xl font-bold tracking-tight">No Items Found</h3>
                <p className="text-sm">Try adjusting your search or filters.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {dialogState.type === 'add' && (
        <ItemFormDialog
          open={true}
          onOpenChange={handleCloseDialog}
          onSave={handleSaveItem}
        />
      )}
      {dialogState.type === 'edit' && (
        <ItemFormDialog
          open={true}
          onOpenChange={handleCloseDialog}
          onSave={handleSaveItem}
          item={dialogState.item}
        />
      )}
      {dialogState.type === 'delete' && (
        <DeleteItemDialog
          open={true}
          onOpenChange={handleCloseDialog}
          onDelete={() => handleDeleteItem(dialogState.item.id)}
          item={dialogState.item}
        />
      )}
      {dialogState.type === 'analyze' && (
        <LowStockAnalyzerDialog
          open={true}
          onOpenChange={handleCloseDialog}
          item={dialogState.item}
          onApply={(newThreshold) => handleUpdateThreshold(dialogState.item.id, newThreshold)}
        />
      )}
    </DashboardLayout>
  );
}
