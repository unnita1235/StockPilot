const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  addStock,
  removeStock,
  adjustStock,
  getItemMovements,
  getRecentMovements,
  quickUpdate
} = require('../controllers/stockController');
const { optionalAuth } = require('../middleware/auth');
const {
  validateStockPayload,
  validateAdjustStock,
  validateItemId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validators');

// Stock operations
router.post('/add', optionalAuth, validateStockPayload, addStock);
router.post('/remove', optionalAuth, validateStockPayload, removeStock);
router.post('/adjust', optionalAuth, validateAdjustStock, adjustStock);
router.put('/quick-update/:id', optionalAuth, validateItemId, body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'), handleValidationErrors, quickUpdate);

// Movement history
router.get('/movements/recent', optionalAuth, validatePagination, getRecentMovements);
router.get('/movements/:itemId', optionalAuth, param('itemId').isMongoId().withMessage('Invalid item ID format'), validatePagination, handleValidationErrors, getItemMovements);

module.exports = router;
