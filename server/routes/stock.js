const express = require('express');
const router = express.Router();
const {
  addStock,
  removeStock,
  adjustStock,
  getItemMovements,
  getRecentMovements,
  quickUpdate
} = require('../controllers/stockController');
const { optionalAuth } = require('../middleware/auth');

// Stock operations
router.post('/add', optionalAuth, addStock);
router.post('/remove', optionalAuth, removeStock);
router.post('/adjust', optionalAuth, adjustStock);
router.put('/quick-update/:id', optionalAuth, quickUpdate);

// Movement history
router.get('/movements/recent', optionalAuth, getRecentMovements);
router.get('/movements/:itemId', optionalAuth, getItemMovements);

module.exports = router;
