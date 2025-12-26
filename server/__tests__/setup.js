// Test setup file
const mongoose = require('mongoose');

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockpilot-test';

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

