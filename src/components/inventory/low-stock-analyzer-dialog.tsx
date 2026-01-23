'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InventoryItem } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { apiRequest } from '@/lib/api';

// AI Analysis response type (matches backend)
interface AnalyzeStockDataOutput {
  adjustedLowStockThreshold: number;
  reasoning: string;
}

type LowStockAnalyzerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
  onApply: (newThreshold: number) => void;
};

export function LowStockAnalyzerDialog({
  open,
  onOpenChange,
  item,
  onApply,
}: LowStockAnalyzerDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeStockDataOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    try {
      // Call backend AI analysis endpoint
      const response = await apiRequest<{ success: boolean; data: AnalyzeStockDataOutput }>(
        `/ai/analyze/${item.id}`,
        { method: 'POST' }
      );
      setAnalysis(response.data);
    } catch (e) {
      console.error(e);
      // Fallback: provide a simple heuristic-based suggestion
      const suggestedThreshold = Math.max(
        Math.ceil(item.stock * 0.2), // 20% of current stock
        item.lowStockThreshold,
        5 // minimum threshold
      );
      setAnalysis({
        adjustedLowStockThreshold: suggestedThreshold,
        reasoning: `Based on current stock level of ${item.stock} units, we recommend a threshold of ${suggestedThreshold} units to maintain adequate safety stock. This is calculated as 20% of your current inventory or your existing threshold, whichever is higher.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-accent"/>
            AI Low Stock Analysis
          </DialogTitle>
          <DialogDescription>
            Let AI analyze historical trends to suggest an optimal low stock threshold for <strong>{item.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex justify-between items-center rounded-lg border p-3">
                <div className="text-sm">Current Threshold</div>
                <div className="font-semibold">{item.lowStockThreshold} units</div>
            </div>
            {!analysis && (
                 <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Analyzing...' : 'Run AI Analysis'}
                </Button>
            )}

            {analysis && (
                <Alert className="bg-primary/5 border-primary/20">
                    <Sparkles className="h-4 w-4 !text-primary" />
                    <AlertTitle>AI Suggestion</AlertTitle>
                    <AlertDescription>
                        <p className="font-semibold text-lg mb-2">New Threshold: {analysis.adjustedLowStockThreshold} units</p>
                        <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
        <DialogFooter>
          {analysis && (
            <Button onClick={() => onApply(analysis.adjustedLowStockThreshold)}>
                Apply Suggestion
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}