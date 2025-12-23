const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getStockTrends,
  getItemForecast,
  getCategoryAnalysis,
  getTopMovers,
  getAlerts
} = require('../controllers/analyticsController');
const { optionalAuth } = require('../middleware/auth');

router.get('/dashboard', optionalAuth, getDashboardStats);
router.get('/trends', optionalAuth, getStockTrends);
router.get('/forecast/:itemId', optionalAuth, getItemForecast);
router.get('/categories', optionalAuth, getCategoryAnalysis);
router.get('/top-movers', optionalAuth, getTopMovers);
router.get('/alerts', optionalAuth, getAlerts);

module.exports = router;
