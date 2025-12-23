const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Get all items with filtering and search
const getItems = asyncHandler(async (req, res) => {
  const { category, search, lowStock, sort = '-updatedAt', page = 1, limit = 50 } = req.query;

  const query = {};

  if (category && category !== 'All') {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }

  if (lowStock === 'true') {
    query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [items, total] = await Promise.all([
    Item.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Item.countDocuments(query)
  ]);

  // Add isLowStock field since lean() doesn't include virtuals
  const itemsWithStatus = items.map(item => ({
    ...item,
    isLowStock: item.stock <= item.lowStockThreshold
  }));

  res.json({
    success: true,
    data: itemsWithStatus,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get single item by ID
const getItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  res.json({
    success: true,
    data: item
  });
});

// Create new item
const createItem = asyncHandler(async (req, res) => {
  const { name, description, stock, category, lowStockThreshold, sku, unitPrice } = req.body;

  const item = await Item.create({
    name,
    description,
    stock: stock || 0,
    category,
    lowStockThreshold: lowStockThreshold || 10,
    sku,
    unitPrice,
    createdBy: req.user?._id
  });

  // Record initial stock as a movement if stock > 0
  if (stock > 0) {
    await StockMovement.create({
      item: item._id,
      type: 'in',
      quantity: stock,
      previousStock: 0,
      newStock: stock,
      reason: 'Initial stock',
      performedBy: req.user?._id
    });
  }

  res.status(201).json({
    success: true,
    data: item
  });
});

// Update item
const updateItem = asyncHandler(async (req, res) => {
  const { name, description, category, lowStockThreshold, sku, unitPrice } = req.body;

  // Don't allow direct stock updates through this endpoint
  // Stock should be modified through stock movements
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;
  if (sku !== undefined) updateData.sku = sku;
  if (unitPrice !== undefined) updateData.unitPrice = unitPrice;

  const item = await Item.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  res.json({
    success: true,
    data: item
  });
});

// Delete item
const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    throw new AppError('Item not found', 404);
  }

  // Also delete related stock movements
  await StockMovement.deleteMany({ item: req.params.id });
  await item.deleteOne();

  res.json({
    success: true,
    message: 'Item deleted'
  });
});

// Get low stock items
const getLowStockItems = asyncHandler(async (req, res) => {
  const items = await Item.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
  }).sort({ stock: 1 });

  res.json({
    success: true,
    data: items,
    count: items.length
  });
});

// Bulk import items
const bulkImport = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Items array is required', 400);
  }

  const results = {
    imported: 0,
    failed: 0,
    errors: []
  };

  for (const itemData of items) {
    try {
      await Item.create({
        ...itemData,
        createdBy: req.user?._id
      });
      results.imported++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        item: itemData.name || 'Unknown',
        error: err.message
      });
    }
  }

  res.json({
    success: true,
    data: results
  });
});

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
  bulkImport
};
