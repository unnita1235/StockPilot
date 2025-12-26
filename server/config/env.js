// Environment variable validation
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const requiredEnvVars = [
  'JWT_SECRET',
];

const optionalEnvVars = {
  MONGODB_URI: 'mongodb://localhost:27017/stockpilot',
  PORT: '3001',
  NODE_ENV: 'development',
  FRONTEND_URL: 'http://localhost:9002',
  JWT_EXPIRES_IN: '7d',
};

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  console.error('\nPlease create a .env file with the required variables.');
  console.error('See .env.example for reference.');
  process.exit(1);
}

// Set default values for optional variables
Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
  if (!process.env[key]) {
    process.env[key] = defaultValue;
  }
});

// Validate JWT_SECRET strength in production
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters long in production!');
  }
  if (jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
    console.error('ERROR: JWT_SECRET must be changed from default value in production!');
    process.exit(1);
  }
}

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: parseInt(process.env.PORT, 10),
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
};

