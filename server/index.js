// Load environment variables first
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const envConfig = require('./config/env');
const logger = require('./config/logger');

const itemRoutes = require('./routes/items');
const stockRoutes = require('./routes/stock');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS configuration
app.use(cors({
  origin: envConfig.FRONTEND_URL,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'StockPilot API Documentation',
}));

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Database connection and server start
mongoose.connect(envConfig.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(envConfig.PORT, () => {
      logger.info(`Server running on port ${envConfig.PORT}`);
      logger.info(`API documentation available at http://localhost:${envConfig.PORT}/api-docs`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
