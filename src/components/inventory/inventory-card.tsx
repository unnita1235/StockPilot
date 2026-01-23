'use client';

import { InventoryItem } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Package, MoreVertical, Edit, Trash2, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, type: 'add' | 'remove') => void;
}

export function InventoryCard({ item, onEdit, onDelete, onAdjustStock }: InventoryCardProps) {
  const isLowStock = item.stock <= item.lowStockThreshold;
  const isOutOfStock = item.stock === 0;

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      isOutOfStock && "border-red-200 bg-red-50/50",
      isLowStock && !isOutOfStock && "border-orange-200 bg-orange-50/50"
    )}>
      <div className="aspect-video relative bg-muted">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAdjustStock(item.id, 'add')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAdjustStock(item.id, 'remove')}>
                <Minus className="mr-2 h-4 w-4" />
                Remove Stock
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {(isLowStock || isOutOfStock) && (
          <Badge 
            className={cn(
              "absolute top-2 left-2",
              isOutOfStock ? "bg-red-500" : "bg-orange-500"
            )}
          >
            {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold line-clamp-1">{item.name}</h3>
            {item.unitPrice !== undefined && item.unitPrice > 0 && (
              <span className="text-sm font-medium text-green-600">
                ${item.unitPrice.toFixed(2)}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between pt-2">
            <Badge variant="outline">{item.category}</Badge>
            <div className="flex items-center gap-1 text-sm">
              <span className={cn(
                "font-semibold",
                isOutOfStock && "text-red-600",
                isLowStock && !isOutOfStock && "text-orange-600"
              )}>
                {item.stock}
              </span>
              <span className="text-muted-foreground">in stock</span>
            </div>
          </div>
          {item.sku && (
            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
