const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('./errorHandler');
const envConfig = require('../config/env');

const JWT_SECRET = envConfig.JWT_SECRET;

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: envConfig.JWT_EXPIRES_IN
  });
};

// Protect routes - require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized to access this route', 401);
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  if (!user.isActive) {
    throw new AppError('User account is deactivated', 401);
  }

  req.user = user;
  next();
});

// Optional auth - attach user if token present but don't require it
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Token invalid, continue without user
    }
  }

  next();
});

// Restrict to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Not authorized to perform this action', 403);
    }
    next();
  };
};

module.exports = { generateToken, protect, optionalAuth, authorize };
