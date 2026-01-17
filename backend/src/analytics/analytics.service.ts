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
        // Fetch recent movements for the "Recent Activity" list
        const recentMovements = await this.stockModel.find().limit(10).sort({ createdAt: -1 }).exec();

        // Fetch actual movements from the last 7 days for the "Weekly Activity" cards
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyMovements = await this.stockModel.find({ 
            createdAt: { $gte: sevenDaysAgo } 
        }).exec();

        const totalItems = items.length;
        const lowStockItems = items.filter((item) => item.quantity <= (item.threshold || 5)).length;
        const lowStockPercentage = totalItems > 0 ? ((lowStockItems / totalItems) * 100).toFixed(1) : 0;

        // Calculate category breakdown
        const categoryBreakdown = items.reduce((acc, item) => {
            const cat = (item as any).category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Real Weekly calculations
        const stockInCount = weeklyMovements.filter(m => m.type === 'IN').length;
        const stockOutCount = weeklyMovements.filter(m => m.type === 'OUT').length;

        const weeklyActivity = {
            stockIn: stockInCount,
            stockOut: stockOutCount,
            movementsIn: stockInCount,
            movementsOut: stockOutCount,
        };

        return {
            totalItems,
            lowStockItems,
            lowStockPercentage,
            categoryBreakdown,
            recentMovements: recentMovements.length,
            // Calculate total value assuming a default price if missing
            totalInventoryValue: items.reduce((sum, item) => sum + (item.quantity * ((item as any).unitPrice || 10)), 0),
            weeklyActivity,
        };
    }

    async getTrends(period: string = '7d') {
        // 1. Calculate the start date based on the period (default 7 days)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // 2. Aggregate real data from MongoDB
        const trends = await this.stockModel.aggregate([
            {
                // Filter movements from the last 7 days
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                // Group by Date (YYYY-MM-DD) and Type (IN/OUT)
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        type: "$type"
                    },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            {
                // Group again by Date to reshape into { date, in, out }
                $group: {
                    _id: "$_id.date",
                    in: {
                        $sum: {
                            $cond: [{ $eq: ["$_id.type", "IN"] }, "$totalQuantity", 0]
                        }
                    },
                    out: {
                        $sum: {
                            $cond: [{ $eq: ["$_id.type", "OUT"] }, "$totalQuantity", 0]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } } // Sort by date ascending
        ]).exec();

        // 3. Map to the format the frontend expects
        return trends.map(t => ({
            date: t._id,
            in: t.in,
            out: t.out
        }));
    }

    async getAlerts() {
        // Find items where quantity is less than or equal to their threshold
        // Note: Using Javascript filter for flexibility if threshold is dynamic per item
        const allItems = await this.inventoryModel.find().exec();
        const lowStockItems = allItems.filter(item => item.quantity <= (item.lowStockThreshold || 5));

        const alerts = lowStockItems.map(item => ({
            id: item._id.toString(),
            type: item.quantity === 0 ? 'critical' : 'warning',
            message: `${item.name} is ${item.quantity === 0 ? 'out of stock' : 'low on stock'} (${item.quantity} remaining)`,
            itemId: item._id.toString(),
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