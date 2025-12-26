const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getUsers,
  updateUserRole
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin
} = require('../middleware/validators');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

// Admin routes
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id', protect, authorize('admin'), updateUserRole);

module.exports = router;
