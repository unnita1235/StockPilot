// 1. Import stockApi
import { stockApi } from '@/lib/api';

// ... inside the component ...

const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis(null);
    setError(null);

    try {
        // --- REAL FIX START ---
        // 1. Fetch real movement history for this specific item
        const movementsResponse = await stockApi.getMovements(item.id);
        
        // 2. Format the movements into a readable string for the AI
        // e.g., "2023-10-25: OUT 5 units (reason: Sale)\n2023-10-24: IN 20 units (reason: Restock)"
        const historyString = (movementsResponse as any).data
            .slice(0, 20) // Limit to last 20 records to save tokens
            .map((m: any) => 
                `${new Date(m.createdAt).toLocaleDateString()}: ${m.type} ${m.quantity} units (Reason: ${m.reason})`
            )
            .join('\n');

        const realHistoricalData = historyString || "No recent stock history available.";
        // --- REAL FIX END ---

        const result = await analyzeStockData({
            itemId: item.id,
            historicalStockData: realHistoricalData, // Pass the REAL data string
            currentStockLevel: item.stock,
            lowStockThreshold: item.lowStockThreshold,
        });
        setAnalysis(result);
    } catch (e) {
        console.error(e);
        setError('Failed to analyze stock data.');
    } finally {
        setIsLoading(false);
    }
};