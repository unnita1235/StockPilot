'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { analyzeStockData, AnalyzeStockDataOutput } from '@/ai/flows/low-stock-alerts-analysis';
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
import { stockApi } from '@/lib/api';

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
      // 1. Fetch REAL movement history for this item
      const response: any = await stockApi.getMovements({ itemId: item.id });
      const movements = Array.isArray(response.data) ? response.data : [];
      
      // 2. Format history for AI
      let historyString = "No recent stock history available.";
      if (movements.length > 0) {
        historyString = movements
          .slice(0, 20)
          .map((m: any) => 
            `${new Date(m.createdAt).toLocaleDateString()}: ${m.type} ${m.quantity} units (Reason: ${m.reason || 'N/A'})`
          )
          .join('\n');
      }

      const result = await analyzeStockData({
        itemId: item.id,
        historicalStockData: historyString, // Real data
        currentStockLevel: item.stock,
        lowStockThreshold: item.lowStockThreshold,
      });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setError('Failed to analyze stock data. Please try again.');
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