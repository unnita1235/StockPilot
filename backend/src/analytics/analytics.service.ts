import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '../inventory/inventory.schema';
import { StockMovement, StockMovementDocument } from '../stock/stock.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(StockMovement.name) private stockModel: Model<StockMovementDocument>,
    ) { }

    async getDashboardStats() {
        const items = await this.inventoryModel.find().exec();
        const movements = await this.stockModel.find().limit(10).sort({ createdAt: -1 }).exec();

        const totalItems = items.length;
        const lowStockItems = items.filter((item) => item.quantity <= (item.threshold || 5)).length;
        const lowStockPercentage = totalItems > 0 ? (lowStockItems / totalItems) * 100 : 0;

        // Calculate category breakdown
        const categoryBreakdown = items.reduce((acc, item) => {
            // Assuming you might add category later, or map based on logic. 
            // For now, let's just use 'Uncategorized' if property missing, 
            // but Schema has `location` which could work as a proxy or just hardcode for MVP if field missing
            const cat = (item as any).category || 'General';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        // Weekly activity (dummy logic vs real aggregations for MPV speed)
        // In a real app, you'd aggregate StockMovements by type over last 7 days
        const weeklyActivity = {
            stockIn: movements.filter(m => m.type === 'IN').length,
            stockOut: movements.filter(m => m.type === 'OUT').length,
            movementsIn: 12, // Dummy for chart visuals if needed or calculate real
            movementsOut: 8,
        };

        return {
            totalItems,
            lowStockItems,
            lowStockPercentage,
            categoryBreakdown,
            recentMovements: movements.length,
            // Assuming a unitPrice field might exist or default to 10 for value calc
            totalInventoryValue: items.reduce((sum, item) => sum + (item.quantity * ((item as any).unitPrice || 0)), 0),
            weeklyActivity,
        };
    }

    async getTrends(period: string) {
        // Return dummy trend data for charts for now
        // Real implementation requires detailed aggregation pipeline
        return [
            { date: '2024-01-01', in: 10, out: 5 },
            { date: '2024-01-02', in: 15, out: 10 },
            { date: '2024-01-03', in: 8, out: 12 },
            { date: '2024-01-04', in: 20, out: 8 },
            { date: '2024-01-05', in: 12, out: 15 },
            { date: '2024-01-06', in: 18, out: 20 },
            { date: '2024-01-07', in: 25, out: 10 },
        ];
    }

    async getAlerts() {
        const items = await this.inventoryModel.find({
            $expr: { $lte: ['$quantity', '$threshold'] }
        }).exec();

        const alerts = items.map(item => ({
            id: item._id,
            type: item.quantity === 0 ? 'critical' : 'warning',
            message: `${item.name} is ${item.quantity === 0 ? 'out of stock' : 'low on stock'} (${item.quantity} remaining)`,
            itemId: item._id,
            createdAt: new Date(),
        }));

        return {
            data: alerts,
            summary: {
                critical: alerts.filter(a => a.type === 'critical').length,
                warning: alerts.filter(a => a.type === 'warning').length,
                info: 0
            }
        };
    }
}
