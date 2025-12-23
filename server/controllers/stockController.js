const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Add stock (stock in)
const addStock = asyncHandler(async (req, res) => {
  const { itemId, quantity, reason, reference } = req.body;

  if (!quantity || quantity <= 0) {
    throw new AppError('Quantity must be a positive number', 400);
  }

  const item = await Item.findById(itemId);
  if (!item) {
    throw new AppError('Item not found', 404);
  }

  const previousStock = item.stock;
  const newStock = previousStock + quantity;

  // Update item stock
  item.stock = newStock;
  await item.save();

  // Record movement
  const movement = await StockMovement.create({
    item: itemId,
    type: 'in',
    quantity,
    previousStock,
    newStock,
    reason: reason || 'Stock received',
    reference,
    performedBy: req.user?._id
  });

  res.status(201).json({
    success: true,
    data: {
      movement,
      item: {
        _id: item._id,
        name: item.name,
        previousStock,
        newStock
      }
    }
  });
});

// Remove stock (stock out)
const removeStock = asyncHandler(async (req, res) => {
  const { itemId, quantity, reason, reference } = req.body;

  if (!quantity || quantity <= 0) {
    throw new AppError('Quantity must be a positive number', 400);
  }

  const item = await Item.findById(itemId);
  if (!item) {
    throw new AppError('Item not found', 404);
  }

  if (item.stock < quantity) {
    throw new AppError(`Insufficient stock. Available: ${item.stock}`, 400);
  }

  const previousStock = item.stock;
  const newStock = previousStock - quantity;

  // Update item stock
  item.stock = newStock;
  await item.save();

  // Record movement
  const movement = await StockMovement.create({
    item: itemId,
    type: 'out',
    quantity,
    previousStock,
    newStock,
    reason: reason || 'Stock used',
    reference,
    performedBy: req.user?._id
  });

  res.status(201).json({
    success: true,
    data: {
      movement,
      item: {
        _id: item._id,
        name: item.name,
        previousStock,
        newStock
      }
    },
    warning: newStock <= item.lowStockThreshold ? 'Item is now at or below low stock threshold' : null
  });
});

// Adjust stock (correction)
const adjustStock = asyncHandler(async (req, res) => {
  const { itemId, newStockLevel, reason } = req.body;

  if (newStockLevel === undefined || newStockLevel < 0) {
    throw new AppError('New stock level must be a non-negative number', 400);
  }

  const item = await Item.findById(itemId);
  if (!item) {
    throw new AppError('Item not found', 404);
  }

  const previousStock = item.stock;
  const difference = newStockLevel - previousStock;

  // Update item stock
  item.stock = newStockLevel;
  await item.save();

  // Record movement
  const movement = await StockMovement.create({
    item: itemId,
    type: 'adjustment',
    quantity: difference,
    previousStock,
    newStock: newStockLevel,
    reason: reason || 'Stock adjustment',
    performedBy: req.user?._id
  });

  res.status(201).json({
    success: true,
    data: {
      movement,
      item: {
        _id: item._id,
        name: item.name,
        previousStock,
        newStock: newStockLevel,
        difference
      }
    }
  });
});

// Get stock movements for an item
const getItemMovements = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { startDate, endDate, type, page = 1, limit = 20 } = req.query;

  const query = { item: itemId };

  if (type) {
    query.type = type;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [movements, total] = await Promise.all([
    StockMovement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('performedBy', 'name email'),
    StockMovement.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: movements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get all recent movements
const getRecentMovements = asyncHandler(async (req, res) => {
  const { limit = 20, type } = req.query;

  const query = {};
  if (type) query.type = type;

  const movements = await StockMovement.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('item', 'name category')
    .populate('performedBy', 'name');

  res.json({
    success: true,
    data: movements
  });
});

// Quick stock update (for UI - simpler endpoint)
const quickUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    throw new AppError('Stock must be a non-negative number', 400);
  }

  const item = await Item.findById(id);
  if (!item) {
    throw new AppError('Item not found', 404);
  }

  const previousStock = item.stock;
  const difference = stock - previousStock;

  item.stock = stock;
  await item.save();

  // Record as adjustment
  if (difference !== 0) {
    await StockMovement.create({
      item: id,
      type: difference > 0 ? 'in' : 'out',
      quantity: Math.abs(difference),
      previousStock,
      newStock: stock,
      reason: 'Quick update from inventory',
      performedBy: req.user?._id
    });
  }

  res.json({
    success: true,
    data: item
  });
});

module.exports = {
  addStock,
  removeStock,
  adjustStock,
  getItemMovements,
  getRecentMovements,
  quickUpdate
};
