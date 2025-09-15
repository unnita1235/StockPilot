'use client';

import { useState, useMemo, useCallback } from 'react';
import { initialInventory, InventoryItem, InventoryCategory } from '@/lib/data';
import { DashboardLayout } from '@/components/dashboard-layout';
import { InventoryActions } from '@/components/inventory/inventory-actions';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { ItemFormDialog } from '@/components/inventory/item-form-dialog';
import { DeleteItemDialog } from '@/components/inventory/delete-item-dialog';
import { LowStockAnalyzerDialog } from '@/components/inventory/low-stock-analyzer-dialog';
import { useToast } from '@/hooks/use-toast';
import { Package, Search } from 'lucide-react';

type DialogState =
  | { type: 'add' }
  | { type: 'edit'; item: InventoryItem }
  | { type: 'delete'; item: InventoryItem }
  | { type: 'analyze'; item: InventoryItem }
  | { type: 'closed' };

export default function Home() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] =
    useState<InventoryCategory | 'All'>('All');
  const [dialogState, setDialogState] = useState<DialogState>({
    type: 'closed',
  });
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

  const handleSaveItem = (itemData: Omit<InventoryItem, 'id'> & { id?: string }) => {
    if (itemData.id) {
      // Edit
      setInventory((prev) =>
        prev.map((item) =>
          item.id === itemData.id ? { ...item, ...itemData } : item
        )
      );
      toast({
        title: 'Item Updated',
        description: `${itemData.name} has been successfully updated.`,
      });
    } else {
      // Add
      const newItem: InventoryItem = {
        ...itemData,
        id: new Date().getTime().toString(),
      };
      setInventory((prev) => [newItem, ...prev]);
       toast({
        title: 'Item Added',
        description: `${newItem.name} has been added to your inventory.`,
      });
    }
    handleCloseDialog();
  };

  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = inventory.find(i => i.id === itemId);
    if (itemToDelete) {
        setInventory((prev) => prev.filter((item) => item.id !== itemId));
        toast({
            title: 'Item Deleted',
            description: `${itemToDelete.name} has been removed from your inventory.`,
            variant: "destructive"
        });
    }
    handleCloseDialog();
  };
  
  const handleUpdateThreshold = (itemId: string, newThreshold: number) => {
    setInventory(prev => prev.map(item => item.id === itemId ? {...item, lowStockThreshold: newThreshold} : item));
    const updatedItem = inventory.find(i => i.id === itemId);
    if(updatedItem){
        toast({
            title: "Threshold Updated",
            description: `Low stock threshold for ${updatedItem.name} updated to ${newThreshold}.`
        })
    }
    handleCloseDialog();
  }

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
      title: "Export Successful",
      description: "Your inventory data has been exported to CSV."
    })
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
          <h1 className="text-xl font-semibold">Inventory</h1>
        </header>
        <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6">
          <InventoryActions
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            activeCategory={activeCategory}
            onAddItem={() => handleOpenDialog({ type: 'add' })}
            onExport={handleExportCsv}
          />
          {filteredInventory.length > 0 ? (
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
