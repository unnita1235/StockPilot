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

    async getDashboardStats(tenantId: string) {
        const items = await this.inventoryModel.find({ tenantId }).exec();
        const recentMovements = await this.stockModel.find({ tenantId }).limit(10).sort({ createdAt: -1 }).exec();

        // REAL Weekly Activity Calculation
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyMovements = await this.stockModel.find({
            tenantId,
            createdAt: { $gte: sevenDaysAgo }
        }).exec();

        const totalItems = items.length;
        // Uses the correct 'lowStockThreshold' field
        const lowStockItems = items.filter((item) => item.quantity <= (item.lowStockThreshold || 5)).length;
        const lowStockPercentage = totalItems > 0 ? ((lowStockItems / totalItems) * 100).toFixed(1) : 0;

        // Calculate category breakdown (Now works because Schema has category)
        const categoryBreakdown = items.reduce((acc, item) => {
            const cat = item.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const weeklyActivity = {
            stockIn: weeklyMovements.filter(m => m.type === 'IN').length,
            stockOut: weeklyMovements.filter(m => m.type === 'OUT').length,
            movementsIn: weeklyMovements.filter(m => m.type === 'IN').length,
            movementsOut: weeklyMovements.filter(m => m.type === 'OUT').length,
        };

        return {
            totalItems,
            lowStockItems,
            lowStockPercentage,
            categoryBreakdown,
            recentMovements: recentMovements.length,
            totalInventoryValue: items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0),
            weeklyActivity,
        };
    }

    async getTrends(tenantId: string, _period: string = '7d') {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const trends = await this._period.aggregate([
            {
                $match: {
                    tenantId,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        type: "$type"
                    },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    in: { $sum: { $cond: [{ $eq: ["$_id.type", "IN"] }, "$totalQuantity", 0] } },
                    out: { $sum: { $cond: [{ $eq: ["$_id.type", "OUT"] }, "$totalQuantity", 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]).exec();

        return trends.map(t => ({
            date: t._id,
            in: t.in,
            out: t.out
        }));
    }

    async getAlerts(tenantId: string) {
        const allItems = await this.inventoryModel.find({ tenantId }).exec();
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
