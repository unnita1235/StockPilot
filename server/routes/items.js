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

// Public routes (with optional auth for tracking who did what)
router.get('/', optionalAuth, getItems);
router.get('/low-stock', optionalAuth, getLowStockItems);
router.get('/:id', optionalAuth, getItem);

// Protected routes
router.post('/', optionalAuth, createItem);
router.put('/:id', optionalAuth, updateItem);
router.delete('/:id', optionalAuth, deleteItem);
router.post('/bulk-import', optionalAuth, bulkImport);

module.exports = router;
