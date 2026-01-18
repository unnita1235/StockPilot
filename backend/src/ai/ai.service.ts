import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '../inventory/inventory.schema';
import { StockMovement, StockMovementDocument } from '../stock/stock.schema';

export interface DemandPrediction {
    itemId: string;
    itemName: string;
    currentStock: number;
    predictedDemand7Days: number;
    predictedDemand30Days: number;
    predictedDemand90Days: number;
    confidenceScore: number;
    recommendedReorderPoint: number;
    recommendedReorderQuantity: number;
    nextRestockDate: string | null;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    insights: string[];
}

export interface InventoryOptimization {
    totalItems: number;
    optimizationScore: number;
    recommendations: {
        itemId: string;
        itemName: string;
        type: 'reorder' | 'reduce' | 'discontinue' | 'promote';
        priority: 'low' | 'medium' | 'high' | 'critical';
        reason: string;
        suggestedAction: string;
        potentialSavings?: number;
    }[];
    summary: {
        itemsNeedingReorder: number;
        overstockedItems: number;
        slowMovingItems: number;
        healthyItems: number;
    };
}

@Injectable()
export class AiService {
    constructor(
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(StockMovement.name) private stockModel: Model<StockMovementDocument>,
    ) { }

    /**
     * Predict demand for a specific item using historical data analysis
     */
    async predictDemand(itemId: string): Promise<DemandPrediction> {
        const item = await this.inventoryModel.findById(itemId).exec();
        if (!item) {
            throw new NotFoundException('Item not found');
        }

        // Get historical movements for the last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const movements = await this.stockModel
            .find({
                itemId: item._id,
                type: 'OUT',
                createdAt: { $gte: ninetyDaysAgo },
            })
            .sort({ createdAt: 1 })
            .exec();

        // Calculate daily demand patterns
        const dailyDemand = this.calculateDailyDemand(movements, 90);
        const weeklyTrend = this.calculateWeeklyTrend(movements);
        
        // Simple linear regression for prediction
        const avgDailyDemand = dailyDemand.reduce((a, b) => a + b, 0) / Math.max(dailyDemand.length, 1);
        const stdDev = this.calculateStdDev(dailyDemand, avgDailyDemand);

        // Predictions with safety buffer
        const safetyFactor = 1.2; // 20% safety buffer
        const predictedDemand7Days = Math.ceil(avgDailyDemand * 7 * safetyFactor);
        const predictedDemand30Days = Math.ceil(avgDailyDemand * 30 * safetyFactor);
        const predictedDemand90Days = Math.ceil(avgDailyDemand * 90 * safetyFactor);

        // Calculate confidence score based on data consistency
        const confidenceScore = Math.max(0, Math.min(100, 
            100 - (stdDev / Math.max(avgDailyDemand, 1)) * 50
        ));

        // Calculate reorder recommendations
        const leadTimeDays = 7; // Assumed lead time
        const recommendedReorderPoint = Math.ceil(avgDailyDemand * leadTimeDays * safetyFactor);
        const recommendedReorderQuantity = Math.ceil(avgDailyDemand * 30); // 30-day supply

        // Calculate days until stockout
        const daysUntilStockout = avgDailyDemand > 0 
            ? Math.floor(item.quantity / avgDailyDemand) 
            : null;

        // Determine next restock date
        let nextRestockDate: string | null = null;
        if (daysUntilStockout !== null && daysUntilStockout <= 30) {
            const restockDate = new Date();
            restockDate.setDate(restockDate.getDate() + Math.max(0, daysUntilStockout - leadTimeDays));
            nextRestockDate = restockDate.toISOString().split('T')[0];
        }

        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' | 'critical';
        if (item.quantity === 0) {
            riskLevel = 'critical';
        } else if (daysUntilStockout !== null && daysUntilStockout <= 7) {
            riskLevel = 'critical';
        } else if (daysUntilStockout !== null && daysUntilStockout <= 14) {
            riskLevel = 'high';
        } else if (daysUntilStockout !== null && daysUntilStockout <= 30) {
            riskLevel = 'medium';
        } else {
            riskLevel = 'low';
        }

        // Generate insights
        const insights = this.generateInsights(item, avgDailyDemand, weeklyTrend, daysUntilStockout);

        return {
            itemId: item._id.toString(),
            itemName: item.name,
            currentStock: item.quantity,
            predictedDemand7Days,
            predictedDemand30Days,
            predictedDemand90Days,
            confidenceScore: Math.round(confidenceScore),
            recommendedReorderPoint,
            recommendedReorderQuantity,
            nextRestockDate,
            riskLevel,
            insights,
        };
    }

    /**
     * Get AI-powered inventory optimization recommendations
     */
    async getOptimizationRecommendations(): Promise<InventoryOptimization> {
        const items = await this.inventoryModel.find().exec();
        
        // Get movement stats for all items
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const movementStats = await this.stockModel.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { itemId: '$itemId', type: '$type' },
                    total: { $sum: '$quantity' },
                    count: { $sum: 1 },
                },
            },
        ]).exec();

        // Build stats map
        const statsMap = new Map<string, { in: number; out: number }>();
        movementStats.forEach(stat => {
            const itemId = stat._id.itemId.toString();
            if (!statsMap.has(itemId)) {
                statsMap.set(itemId, { in: 0, out: 0 });
            }
            const current = statsMap.get(itemId)!;
            if (stat._id.type === 'IN') {
                current.in = stat.total;
            } else if (stat._id.type === 'OUT') {
                current.out = stat.total;
            }
        });

        const recommendations: InventoryOptimization['recommendations'] = [];
        let itemsNeedingReorder = 0;
        let overstockedItems = 0;
        let slowMovingItems = 0;
        let healthyItems = 0;

        for (const item of items) {
            const itemId = item._id.toString();
            const stats = statsMap.get(itemId) || { in: 0, out: 0 };
            const dailyUsage = stats.out / 30;
            const daysOfStock = dailyUsage > 0 ? item.quantity / dailyUsage : Infinity;

            // Categorize and generate recommendations
            if (item.quantity === 0) {
                itemsNeedingReorder++;
                recommendations.push({
                    itemId,
                    itemName: item.name,
                    type: 'reorder',
                    priority: 'critical',
                    reason: 'Item is out of stock',
                    suggestedAction: `Immediately reorder ${Math.ceil(dailyUsage * 30) || 10} units`,
                });
            } else if (daysOfStock <= 7) {
                itemsNeedingReorder++;
                recommendations.push({
                    itemId,
                    itemName: item.name,
                    type: 'reorder',
                    priority: 'high',
                    reason: `Only ${Math.round(daysOfStock)} days of stock remaining`,
                    suggestedAction: `Reorder ${Math.ceil(dailyUsage * 30)} units within 2 days`,
                });
            } else if (daysOfStock > 180 && stats.out < 5) {
                slowMovingItems++;
                recommendations.push({
                    itemId,
                    itemName: item.name,
                    type: 'promote',
                    priority: 'medium',
                    reason: 'Very slow moving item with high stock',
                    suggestedAction: 'Consider promotional pricing or bundle deals',
                    potentialSavings: item.quantity * (item.unitPrice || 0) * 0.1,
                });
            } else if (daysOfStock > 90) {
                overstockedItems++;
                recommendations.push({
                    itemId,
                    itemName: item.name,
                    type: 'reduce',
                    priority: 'low',
                    reason: `${Math.round(daysOfStock)} days of stock - potentially overstocked`,
                    suggestedAction: 'Reduce next order quantity by 30%',
                    potentialSavings: item.quantity * (item.unitPrice || 0) * 0.15,
                });
            } else if (stats.out === 0 && item.quantity > 0) {
                slowMovingItems++;
                if (item.quantity > 50) {
                    recommendations.push({
                        itemId,
                        itemName: item.name,
                        type: 'discontinue',
                        priority: 'medium',
                        reason: 'No sales in 30 days with significant stock',
                        suggestedAction: 'Review item for discontinuation or clearance sale',
                        potentialSavings: item.quantity * (item.unitPrice || 0),
                    });
                }
            } else {
                healthyItems++;
            }
        }

        // Sort recommendations by priority
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        // Calculate optimization score
        const totalItems = items.length || 1;
        const optimizationScore = Math.round(
            (healthyItems / totalItems) * 100
        );

        return {
            totalItems: items.length,
            optimizationScore,
            recommendations: recommendations.slice(0, 20), // Top 20 recommendations
            summary: {
                itemsNeedingReorder,
                overstockedItems,
                slowMovingItems,
                healthyItems,
            },
        };
    }

    /**
     * Batch predict demand for all items
     */
    async batchPredictDemand(): Promise<DemandPrediction[]> {
        const items = await this.inventoryModel.find().exec();
        const predictions: DemandPrediction[] = [];

        for (const item of items) {
            try {
                const prediction = await this.predictDemand(item._id.toString());
                predictions.push(prediction);
            } catch (error) {
                console.error(`Failed to predict demand for item ${item._id}:`, error);
            }
        }

        // Sort by risk level
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        predictions.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

        return predictions;
    }

    // Helper methods
    private calculateDailyDemand(movements: StockMovementDocument[], days: number): number[] {
        const dailyDemand: number[] = new Array(days).fill(0);
        const now = new Date();

        movements.forEach(mov => {
            const movDate = (mov as any).createdAt || new Date();
            const dayIndex = Math.floor(
                (now.getTime() - new Date(movDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (dayIndex >= 0 && dayIndex < days) {
                dailyDemand[days - 1 - dayIndex] += mov.quantity;
            }
        });

        return dailyDemand;
    }

    private calculateWeeklyTrend(movements: StockMovementDocument[]): 'increasing' | 'decreasing' | 'stable' {
        if (movements.length < 14) return 'stable';

        const now = new Date();
        let lastWeek = 0;
        let previousWeek = 0;

        movements.forEach(mov => {
            const movDate = (mov as any).createdAt || new Date();
            const daysAgo = Math.floor(
                (now.getTime() - new Date(movDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysAgo < 7) {
                lastWeek += mov.quantity;
            } else if (daysAgo < 14) {
                previousWeek += mov.quantity;
            }
        });

        const change = previousWeek > 0 ? (lastWeek - previousWeek) / previousWeek : 0;
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    private calculateStdDev(values: number[], mean: number): number {
        if (values.length === 0) return 0;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
    }

    private generateInsights(
        item: InventoryDocument,
        avgDailyDemand: number,
        trend: 'increasing' | 'decreasing' | 'stable',
        daysUntilStockout: number | null
    ): string[] {
        const insights: string[] = [];

        if (avgDailyDemand > 0) {
            insights.push(`Average daily demand: ${avgDailyDemand.toFixed(1)} units`);
        } else {
            insights.push('No recent sales activity detected');
        }

        if (trend === 'increasing') {
            insights.push('⬆️ Demand is trending upward - consider increasing safety stock');
        } else if (trend === 'decreasing') {
            insights.push('⬇️ Demand is trending downward - monitor for overstocking');
        }

        if (daysUntilStockout !== null) {
            if (daysUntilStockout <= 7) {
                insights.push(`⚠️ Critical: Only ${daysUntilStockout} days of stock remaining`);
            } else if (daysUntilStockout <= 14) {
                insights.push(`⚡ Reorder soon: ${daysUntilStockout} days of stock remaining`);
            }
        }

        if (item.quantity > avgDailyDemand * 90 && avgDailyDemand > 0) {
            insights.push('📦 High inventory levels - over 90 days of stock');
        }

        return insights;
    }
}
