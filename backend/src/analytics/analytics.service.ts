import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '../inventory/inventory.schema';
import { StockMovement, StockMovementDocument } from '../stock/stock.schema';

export interface ReportFilters {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    type?: 'inventory' | 'movements' | 'valuation' | 'turnover';
}

export interface InventoryReportItem {
    _id: string;
    name: string;
    sku?: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
    lowStockThreshold: number;
    isLowStock: boolean;
    totalStockIn: number;
    totalStockOut: number;
    turnoverRate: number;
}

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(StockMovement.name) private stockModel: Model<StockMovementDocument>,
    ) { }

    /**
     * Get comprehensive dashboard statistics
     */
    async getDashboardStats() {
        const [items, totalMovements, weeklyStats, monthlyStats] = await Promise.all([
            this.inventoryModel.find().exec(),
            this.stockModel.countDocuments(),
            this.getWeeklyStats(),
            this.getMonthlyStats(),
        ]);

        const totalItems = items.length;
        const lowStockItems = items.filter((item) => item.quantity <= (item.lowStockThreshold || 5)).length;
        const outOfStockItems = items.filter((item) => item.quantity === 0).length;
        const lowStockPercentage = totalItems > 0 ? Number(((lowStockItems / totalItems) * 100).toFixed(1)) : 0;

        // Calculate category breakdown with values
        const categoryBreakdown: Record<string, number> = {};
        const categoryValues: Record<string, number> = {};
        
        items.forEach(item => {
            const cat = item.category || 'Uncategorized';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
            categoryValues[cat] = (categoryValues[cat] || 0) + (item.quantity * (item.unitPrice || 0));
        });

        const totalInventoryValue = items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
        const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

        // Top items by value
        const topItemsByValue = items
            .map(item => ({
                _id: item._id.toString(),
                name: item.name,
                value: item.quantity * (item.unitPrice || 0),
                quantity: item.quantity,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Items needing attention (critical low stock)
        const criticalItems = items
            .filter(item => item.quantity <= (item.lowStockThreshold || 5))
            .map(item => ({
                _id: item._id.toString(),
                name: item.name,
                quantity: item.quantity,
                threshold: item.lowStockThreshold || 5,
                urgency: item.quantity === 0 ? 'critical' : item.quantity <= 2 ? 'high' : 'medium',
            }))
            .sort((a, b) => a.quantity - b.quantity)
            .slice(0, 10);

        return {
            totalItems,
            lowStockItems,
            outOfStockItems,
            lowStockPercentage,
            categoryBreakdown,
            categoryValues,
            totalMovements,
            totalInventoryValue,
            totalUnits,
            weeklyActivity: weeklyStats,
            monthlyActivity: monthlyStats,
            topItemsByValue,
            criticalItems,
        };
    }

    /**
     * Get weekly statistics
     */
    private async getWeeklyStats() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const stats = await this.stockModel.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: '$type',
                    totalQuantity: { $sum: '$quantity' },
                    count: { $sum: 1 },
                },
            },
        ]).exec();

        const inStats = stats.find(s => s._id === 'IN') || { totalQuantity: 0, count: 0 };
        const outStats = stats.find(s => s._id === 'OUT') || { totalQuantity: 0, count: 0 };

        return {
            stockIn: inStats.totalQuantity,
            stockOut: outStats.totalQuantity,
            movementsIn: inStats.count,
            movementsOut: outStats.count,
            netChange: inStats.totalQuantity - outStats.totalQuantity,
        };
    }

    /**
     * Get monthly statistics
     */
    private async getMonthlyStats() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await this.stockModel.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: '$type',
                    totalQuantity: { $sum: '$quantity' },
                    count: { $sum: 1 },
                },
            },
        ]).exec();

        const inStats = stats.find(s => s._id === 'IN') || { totalQuantity: 0, count: 0 };
        const outStats = stats.find(s => s._id === 'OUT') || { totalQuantity: 0, count: 0 };

        return {
            stockIn: inStats.totalQuantity,
            stockOut: outStats.totalQuantity,
            movementsIn: inStats.count,
            movementsOut: outStats.count,
            netChange: inStats.totalQuantity - outStats.totalQuantity,
        };
    }

    /**
     * Get trends with configurable period
     */
    async getTrends(period: string = 'week') {
        let days: number;
        let dateFormat: string;

        switch (period) {
            case 'day':
                days = 1;
                dateFormat = '%Y-%m-%d %H:00';
                break;
            case 'week':
                days = 7;
                dateFormat = '%Y-%m-%d';
                break;
            case 'month':
                days = 30;
                dateFormat = '%Y-%m-%d';
                break;
            case 'quarter':
                days = 90;
                dateFormat = '%Y-%W'; // Week of year
                break;
            case 'year':
                days = 365;
                dateFormat = '%Y-%m';
                break;
            default:
                days = 7;
                dateFormat = '%Y-%m-%d';
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const trends = await this.stockModel.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                        type: '$type',
                    },
                    totalQuantity: { $sum: '$quantity' },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: '$_id.date',
                    in: { $sum: { $cond: [{ $eq: ['$_id.type', 'IN'] }, '$totalQuantity', 0] } },
                    out: { $sum: { $cond: [{ $eq: ['$_id.type', 'OUT'] }, '$totalQuantity', 0] } },
                    inCount: { $sum: { $cond: [{ $eq: ['$_id.type', 'IN'] }, '$count', 0] } },
                    outCount: { $sum: { $cond: [{ $eq: ['$_id.type', 'OUT'] }, '$count', 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]).exec();

        return trends.map(t => ({
            date: t._id,
            in: t.in,
            out: t.out,
            inCount: t.inCount,
            outCount: t.outCount,
            net: t.in - t.out,
        }));
    }

    /**
     * Get alerts with priority sorting
     */
    async getAlerts() {
        const allItems = await this.inventoryModel.find().exec();
        const lowStockItems = allItems.filter(item => item.quantity <= (item.lowStockThreshold || 5));

        const alerts = lowStockItems.map(item => {
            let type: 'critical' | 'warning' | 'info';
            let priority: number;

            if (item.quantity === 0) {
                type = 'critical';
                priority = 1;
            } else if (item.quantity <= Math.ceil((item.lowStockThreshold || 5) / 2)) {
                type = 'critical';
                priority = 2;
            } else {
                type = 'warning';
                priority = 3;
            }

            return {
                id: item._id.toString(),
                type,
                priority,
                message: `${item.name} is ${item.quantity === 0 ? 'out of stock' : 'low on stock'} (${item.quantity}/${item.lowStockThreshold || 5})`,
                itemId: item._id.toString(),
                itemName: item.name,
                currentStock: item.quantity,
                threshold: item.lowStockThreshold || 5,
                category: item.category,
                createdAt: new Date().toISOString(),
            };
        }).sort((a, b) => a.priority - b.priority);

        return {
            data: alerts,
            summary: {
                critical: alerts.filter(a => a.type === 'critical').length,
                warning: alerts.filter(a => a.type === 'warning').length,
                info: 0,
                total: alerts.length,
            },
        };
    }

    /**
     * Get detailed inventory report
     */
    async getInventoryReport(filters?: ReportFilters): Promise<InventoryReportItem[]> {
        const query: any = {};
        if (filters?.category) {
            query.category = filters.category;
        }

        const items = await this.inventoryModel.find(query).exec();

        // Get movement stats for each item
        const itemIds = items.map(i => i._id);
        const movementStats = await this.stockModel.aggregate([
            { $match: { itemId: { $in: itemIds } } },
            {
                $group: {
                    _id: { itemId: '$itemId', type: '$type' },
                    total: { $sum: '$quantity' },
                },
            },
        ]).exec();

        // Build movement map
        const movementMap = new Map<string, { in: number; out: number }>();
        movementStats.forEach(stat => {
            const itemId = stat._id.itemId.toString();
            if (!movementMap.has(itemId)) {
                movementMap.set(itemId, { in: 0, out: 0 });
            }
            const current = movementMap.get(itemId)!;
            if (stat._id.type === 'IN') {
                current.in = stat.total;
            } else if (stat._id.type === 'OUT') {
                current.out = stat.total;
            }
        });

        return items.map(item => {
            const itemId = item._id.toString();
            const movements = movementMap.get(itemId) || { in: 0, out: 0 };
            const totalValue = item.quantity * (item.unitPrice || 0);
            
            // Calculate turnover rate (items sold / average inventory)
            const avgInventory = (movements.in + item.quantity) / 2 || 1;
            const turnoverRate = movements.out / avgInventory;

            return {
                _id: itemId,
                name: item.name,
                sku: item.sku,
                category: item.category || 'Uncategorized',
                quantity: item.quantity,
                unitPrice: item.unitPrice || 0,
                totalValue,
                lowStockThreshold: item.lowStockThreshold || 5,
                isLowStock: item.quantity <= (item.lowStockThreshold || 5),
                totalStockIn: movements.in,
                totalStockOut: movements.out,
                turnoverRate: Number(turnoverRate.toFixed(2)),
            };
        });
    }

    /**
     * Get valuation report grouped by category
     */
    async getValuationReport() {
        const items = await this.inventoryModel.find().exec();

        const categoryStats = new Map<string, {
            itemCount: number;
            totalUnits: number;
            totalValue: number;
            lowStockCount: number;
        }>();

        items.forEach(item => {
            const cat = item.category || 'Uncategorized';
            if (!categoryStats.has(cat)) {
                categoryStats.set(cat, {
                    itemCount: 0,
                    totalUnits: 0,
                    totalValue: 0,
                    lowStockCount: 0,
                });
            }
            const stats = categoryStats.get(cat)!;
            stats.itemCount++;
            stats.totalUnits += item.quantity;
            stats.totalValue += item.quantity * (item.unitPrice || 0);
            if (item.quantity <= (item.lowStockThreshold || 5)) {
                stats.lowStockCount++;
            }
        });

        const categories = Array.from(categoryStats.entries()).map(([category, stats]) => ({
            category,
            ...stats,
            averageItemValue: stats.itemCount > 0 ? stats.totalValue / stats.itemCount : 0,
        }));

        const totals = {
            totalItems: items.length,
            totalUnits: items.reduce((sum, i) => sum + i.quantity, 0),
            totalValue: items.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0),
            totalLowStock: items.filter(i => i.quantity <= (i.lowStockThreshold || 5)).length,
        };

        return {
            categories,
            totals,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Get movement report with filtering
     */
    async getMovementReport(filters?: ReportFilters) {
        const query: any = {};

        if (filters?.startDate) {
            query.createdAt = { $gte: filters.startDate };
        }
        if (filters?.endDate) {
            query.createdAt = { ...query.createdAt, $lte: filters.endDate };
        }

        const movements = await this.stockModel
            .find(query)
            .populate('itemId', 'name sku category')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .exec();

        // Aggregate by type and reason
        const byType = await this.stockModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$type',
                    totalQuantity: { $sum: '$quantity' },
                    count: { $sum: 1 },
                },
            },
        ]).exec();

        const byReason = await this.stockModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$reason',
                    totalQuantity: { $sum: '$quantity' },
                    count: { $sum: 1 },
                },
            },
        ]).exec();

        return {
            movements,
            summary: {
                byType: byType.reduce((acc, t) => {
                    acc[t._id] = { quantity: t.totalQuantity, count: t.count };
                    return acc;
                }, {} as Record<string, { quantity: number; count: number }>),
                byReason: byReason.reduce((acc, r) => {
                    acc[r._id] = { quantity: r.totalQuantity, count: r.count };
                    return acc;
                }, {} as Record<string, { quantity: number; count: number }>),
                totalMovements: movements.length,
            },
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Get turnover analysis
     */
    async getTurnoverAnalysis(days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const items = await this.inventoryModel.find().exec();
        
        const movementStats = await this.stockModel.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { itemId: '$itemId', type: '$type' },
                    total: { $sum: '$quantity' },
                    count: { $sum: 1 },
                },
            },
        ]).exec();

        const statsMap = new Map<string, { in: number; out: number; inCount: number; outCount: number }>();
        movementStats.forEach(stat => {
            const itemId = stat._id.itemId.toString();
            if (!statsMap.has(itemId)) {
                statsMap.set(itemId, { in: 0, out: 0, inCount: 0, outCount: 0 });
            }
            const current = statsMap.get(itemId)!;
            if (stat._id.type === 'IN') {
                current.in = stat.total;
                current.inCount = stat.count;
            } else if (stat._id.type === 'OUT') {
                current.out = stat.total;
                current.outCount = stat.count;
            }
        });

        const analysis = items.map(item => {
            const itemId = item._id.toString();
            const stats = statsMap.get(itemId) || { in: 0, out: 0, inCount: 0, outCount: 0 };
            
            const dailyUsage = stats.out / days;
            const daysUntilStockout = dailyUsage > 0 ? Math.floor(item.quantity / dailyUsage) : Infinity;
            const turnoverRate = item.quantity > 0 ? stats.out / item.quantity : 0;

            return {
                _id: itemId,
                name: item.name,
                category: item.category,
                currentStock: item.quantity,
                stockIn: stats.in,
                stockOut: stats.out,
                dailyUsage: Number(dailyUsage.toFixed(2)),
                daysUntilStockout: daysUntilStockout === Infinity ? null : daysUntilStockout,
                turnoverRate: Number(turnoverRate.toFixed(2)),
                velocity: stats.out > stats.in ? 'fast' : stats.out < stats.in ? 'slow' : 'stable',
            };
        }).sort((a, b) => (b.turnoverRate || 0) - (a.turnoverRate || 0));

        // Categorize items
        const fastMoving = analysis.filter(a => a.velocity === 'fast');
        const slowMoving = analysis.filter(a => a.velocity === 'slow');
        const stable = analysis.filter(a => a.velocity === 'stable');

        return {
            items: analysis,
            summary: {
                fastMovingCount: fastMoving.length,
                slowMovingCount: slowMoving.length,
                stableCount: stable.length,
                averageTurnover: analysis.reduce((sum, a) => sum + a.turnoverRate, 0) / analysis.length || 0,
            },
            period: `${days} days`,
            generatedAt: new Date().toISOString(),
        };
    }
}