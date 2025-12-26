const express = require('express');
const router = express.Router();
const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
  bulkImport
} = require('../controllers/itemController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const {
  validateCreateItem,
  validateUpdateItem,
  validateItemId,
  validatePagination,
  validateBulkImport
} = require('../middleware/validators');

// Public routes (with optional auth for tracking who did what)
router.get('/', optionalAuth, validatePagination, getItems);
router.get('/low-stock', optionalAuth, getLowStockItems);
router.get('/:id', optionalAuth, validateItemId, getItem);

// Protected routes
router.post('/', optionalAuth, validateCreateItem, createItem);
router.put('/:id', optionalAuth, validateItemId, validateUpdateItem, updateItem);
router.delete('/:id', optionalAuth, validateItemId, deleteItem);
router.post('/bulk-import', optionalAuth, validateBulkImport, bulkImport);

module.exports = router;
