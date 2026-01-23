export class ForecastResultDto {
    stockOutDate: Date | null; // null if never running out
    reorderQuantity: number;
    dailyUsage: number;
    daysUntilStockout: number | null;
    status: 'Safe' | 'Low' | 'Critical';
}
