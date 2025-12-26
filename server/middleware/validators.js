const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`).join(', ');
    throw new AppError(`Validation failed: ${errorMessages}`, 400);
  }
  next();
};

// Item validators
const validateCreateItem = [
  body('name')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ min: 1, max: 200 }).withMessage('Item name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Raw Material', 'Packaging Material', 'Product for Sale']).withMessage('Invalid category'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer'),
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('SKU must be less than 100 characters'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  handleValidationErrors,
];

const validateUpdateItem = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Item name cannot be empty')
    .isLength({ min: 1, max: 200 }).withMessage('Item name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('category')
    .optional()
    .isIn(['Raw Material', 'Packaging Material', 'Product for Sale']).withMessage('Invalid category'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer'),
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('SKU must be less than 100 characters'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  handleValidationErrors,
];

const validateItemId = [
  param('id')
    .notEmpty().withMessage('Item ID is required')
    .isMongoId().withMessage('Invalid item ID format'),
  handleValidationErrors,
];

// Stock validators
const validateStockPayload = [
  body('itemId')
    .notEmpty().withMessage('Item ID is required')
    .isMongoId().withMessage('Invalid item ID format'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must be less than 500 characters'),
  body('reference')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Reference must be less than 200 characters'),
  handleValidationErrors,
];

const validateAdjustStock = [
  body('itemId')
    .notEmpty().withMessage('Item ID is required')
    .isMongoId().withMessage('Invalid item ID format'),
  body('newStockLevel')
    .notEmpty().withMessage('New stock level is required')
    .isInt({ min: 0 }).withMessage('New stock level must be a non-negative integer'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must be less than 500 characters'),
  handleValidationErrors,
];

// Auth validators
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Query validators
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

const validateBulkImport = [
  body('items')
    .isArray({ min: 1 }).withMessage('Items array is required and must not be empty'),
  body('items.*.name')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ min: 1, max: 200 }).withMessage('Item name must be between 1 and 200 characters'),
  body('items.*.category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Raw Material', 'Packaging Material', 'Product for Sale']).withMessage('Invalid category'),
  handleValidationErrors,
];

module.exports = {
  validateCreateItem,
  validateUpdateItem,
  validateItemId,
  validateStockPayload,
  validateAdjustStock,
  validateRegister,
  validateLogin,
  validatePagination,
  validateBulkImport,
  handleValidationErrors,
};

