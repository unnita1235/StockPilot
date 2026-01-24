

import { Package } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Package className="h-5 w-5 text-primary-foreground" />
      </div>
      <h1 className="text-xl font-semibold text-sidebar-foreground">StockPilot</h1>
    </div>
  );
}
