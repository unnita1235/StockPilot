const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const { asyncHandler } = require('../middleware/errorHandler');
const { analyzeItem, forecastDemand, detectTrend } = require('../utils/forecast');

// Get dashboard summary stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalItems,
    lowStockItems,
    categoryBreakdown,
    recentMovements,
    totalValue
  ] = await Promise.all([
    Item.countDocuments(),
    Item.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
    Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } }
    ]),
    StockMovement.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }),
    Item.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$unitPrice'] } } } }
    ])
  ]);

  // Calculate stock movements in last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const movementStats = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: weekAgo } } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalQuantity: { $sum: { $abs: '$quantity' } }
      }
    }
  ]);

  const stockIn = movementStats.find(m => m._id === 'in') || { count: 0, totalQuantity: 0 };
  const stockOut = movementStats.find(m => m._id === 'out') || { count: 0, totalQuantity: 0 };

  res.json({
    success: true,
    data: {
      totalItems,
      lowStockItems,
      lowStockPercentage: totalItems > 0 ? Math.round((lowStockItems / totalItems) * 100) : 0,
      categoryBreakdown: categoryBreakdown.reduce((acc, cat) => {
        acc[cat._id] = { count: cat.count, totalStock: cat.totalStock };
        return acc;
      }, {}),
      recentMovements,
      totalInventoryValue: totalValue[0]?.total || 0,
      weeklyActivity: {
        stockIn: stockIn.totalQuantity,
        stockOut: stockOut.totalQuantity,
        movementsIn: stockIn.count,
        movementsOut: stockOut.count
      }
    }
  });
});

// Get stock trends over time
const getStockTrends = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  let days;
  switch (period) {
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    case '90d': days = 90; break;
    default: days = 30;
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get daily movement totals
  const dailyMovements = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type'
        },
        total: { $sum: { $abs: '$quantity' } }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  // Transform to chart-friendly format
  const dateMap = {};
  dailyMovements.forEach(m => {
    if (!dateMap[m._id.date]) {
      dateMap[m._id.date] = { date: m._id.date, in: 0, out: 0, adjustment: 0 };
    }
    dateMap[m._id.date][m._id.type] = m.total;
  });

  res.json({
    success: true,
    data: Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date))
  });
});

// Get forecast for an item
const getItemForecast = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { days = 14 } = req.query;

  const item = await Item.findById(itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  // Get last 30 days of stock out movements
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const movements = await StockMovement.aggregate([
    {
      $match: {
        item: item._id,
        type: 'out',
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$quantity' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill in missing days with zeros and extract usage array
  const dailyUsage = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const movement = movements.find(m => m._id === dateStr);
    dailyUsage.push(movement ? movement.total : 0);
  }

  const analysis = analyzeItem(item.stock, item.lowStockThreshold, dailyUsage);

  res.json({
    success: true,
    data: {
      item: {
        _id: item._id,
        name: item.name,
        category: item.category
      },
      ...analysis,
      historicalUsage: dailyUsage.slice(-14) // Last 14 days
    }
  });
});

// Get category analysis
const getCategoryAnalysis = asyncHandler(async (req, res) => {
  const analysis = await Item.aggregate([
    {
      $group: {
        _id: '$category',
        itemCount: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        totalValue: { $sum: { $multiply: ['$stock', '$unitPrice'] } },
        avgStock: { $avg: '$stock' },
        lowStockCount: {
          $sum: { $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0] }
        }
      }
    },
    { $sort: { totalValue: -1 } }
  ]);

  res.json({
    success: true,
    data: analysis
  });
});

// Get top movers (items with most activity)
const getTopMovers = asyncHandler(async (req, res) => {
  const { period = '7d', limit = 10 } = req.query;

  let days;
  switch (period) {
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    default: days = 7;
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const topMovers = await StockMovement.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$item',
        totalMovements: { $sum: 1 },
        totalIn: {
          $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0] }
        },
        totalOut: {
          $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0] }
        }
      }
    },
    { $sort: { totalMovements: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'items',
        localField: '_id',
        foreignField: '_id',
        as: 'item'
      }
    },
    { $unwind: '$item' },
    {
      $project: {
        _id: 1,
        name: '$item.name',
        category: '$item.category',
        currentStock: '$item.stock',
        totalMovements: 1,
        totalIn: 1,
        totalOut: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: topMovers
  });
});

// Get alerts (low stock, slow moving, etc.)
const getAlerts = asyncHandler(async (req, res) => {
  const alerts = [];

  // Low stock items
  const lowStockItems = await Item.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
  }).select('name stock lowStockThreshold category');

  lowStockItems.forEach(item => {
    alerts.push({
      type: 'low_stock',
      severity: item.stock === 0 ? 'critical' : 'warning',
      message: `${item.name} is ${item.stock === 0 ? 'out of stock' : 'low on stock'}`,
      item: {
        _id: item._id,
        name: item.name,
        stock: item.stock,
        threshold: item.lowStockThreshold
      }
    });
  });

  // Items with no movement in 30 days (slow moving)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeItemIds = await StockMovement.distinct('item', {
    createdAt: { $gte: thirtyDaysAgo }
  });

  const slowMoving = await Item.find({
    _id: { $nin: activeItemIds },
    stock: { $gt: 0 }
  }).select('name stock category');

  slowMoving.forEach(item => {
    alerts.push({
      type: 'slow_moving',
      severity: 'info',
      message: `${item.name} has had no movement in 30 days`,
      item: {
        _id: item._id,
        name: item.name,
        stock: item.stock
      }
    });
  });

  res.json({
    success: true,
    data: alerts,
    summary: {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length
    }
  });
});

module.exports = {
  getDashboardStats,
  getStockTrends,
  getItemForecast,
  getCategoryAnalysis,
  getTopMovers,
  getAlerts
};
