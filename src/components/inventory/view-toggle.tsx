'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  view: 'table' | 'grid';
  onViewChange: (view: 'table' | 'grid') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center border rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0",
          view === 'table' && "bg-muted"
        )}
        onClick={() => onViewChange('table')}
      >
        <List className="h-4 w-4" />
        <span className="sr-only">Table view</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0",
          view === 'grid' && "bg-muted"
        )}
        onClick={() => onViewChange('grid')}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Grid view</span>
      </Button>
    </div>
  );
}
