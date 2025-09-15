'use client';

import { FileDown, PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categories, InventoryCategory } from '@/lib/data';

type InventoryActionsProps = {
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: InventoryCategory | 'All') => void;
  activeCategory: InventoryCategory | 'All';
  onAddItem: () => void;
  onExport: () => void;
};

export function InventoryActions({
  onSearchChange,
  onCategoryChange,
  activeCategory,
  onAddItem,
  onExport,
}: InventoryActionsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            className="pl-9"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExport}>
            <FileDown />
            Export CSV
          </Button>
          <Button onClick={onAddItem}>
            <PlusCircle />
            Add Item
          </Button>
        </div>
      </div>
      <Tabs value={activeCategory} onValueChange={(value) => onCategoryChange(value as InventoryCategory | 'All')}>
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
