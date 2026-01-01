const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const logger = require('../config/logger');

const User = require('../models/User');
const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');

const seedData = async () => {
  try {
    // MongoDB Atlas connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockpilot';
    
    logger.info(`Connecting to MongoDB: ${mongoUri.substring(0, 50)}...`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
    });

    logger.info('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    await StockMovement.deleteMany({});
    logger.info('🗑️  Cleared existing data');

    // Create demo user
    const hashedPassword = await bcryptjs.hash('demo123456', 10);
    const demoUser = await User.create({
      email: 'demo@stockpilot.com',
      password: hashedPassword,
      name: 'Demo User',
    });
    logger.info('✅ Created demo user: demo@stockpilot.com / demo123456');

    // Create 15 realistic inventory items
    const items = await Item.insertMany([
      {
        name: 'MacBook Pro 16"',
        description: 'Apple MacBook Pro 16-inch 2024 M3 Max 36GB RAM',
        category: 'Electronics',
        quantity: 15,
        lowStockThreshold: 3,
        unitPrice: 3499.00,
        sku: 'ELEC-001',
        userId: demoUser._id,
      },
      {
        name: 'Dell XPS 15',
        description: 'Dell XPS 15 Laptop i9 RTX 4090 32GB',
        category: 'Electronics',
        quantity: 8,
        lowStockThreshold: 2,
        unitPrice: 2299.00,
        sku: 'ELEC-002',
        userId: demoUser._id,
      },
      {
        name: 'USB-C Cable (6ft)',
        description: 'Premium USB-C to USB-C cable 240W',
        category: 'Accessories',
        quantity: 45,
        lowStockThreshold: 10,
        unitPrice: 14.99,
        sku: 'ACC-001',
        userId: demoUser._id,
      },
      {
        name: 'Wireless Mouse',
        description: 'Logitech MX Master 3S Wireless Mouse',
        category: 'Accessories',
        quantity: 2,
        lowStockThreshold: 5,
        unitPrice: 99.99,
        sku: 'ACC-002',
        userId: demoUser._id,
      },
      {
        name: 'Monitor 4K 32"',
        description: 'Dell UltraSharp 32" 4K Monitor 60Hz',
        category: 'Electronics',
        quantity: 5,
        lowStockThreshold: 2,
        unitPrice: 799.99,
        sku: 'ELEC-003',
        userId: demoUser._id,
      },
      {
        name: 'Mechanical Keyboard',
        description: 'Keychron K10 Pro RGB Mechanical Keyboard',
        category: 'Accessories',
        quantity: 12,
        lowStockThreshold: 3,
        unitPrice: 179.99,
        sku: 'ACC-003',
        userId: demoUser._id,
      },
      {
        name: 'Webcam 4K',
        description: 'Logitech C920 Pro 4K HD Webcam 1080p',
        category: 'Accessories',
        quantity: 7,
        lowStockThreshold: 2,
        unitPrice: 129.99,
        sku: 'ACC-004',
        userId: demoUser._id,
      },
      {
        name: 'Laptop Stand',
        description: 'Adjustable aluminum laptop stand portable',
        category: 'Accessories',
        quantity: 0,
        lowStockThreshold: 5,
        unitPrice: 49.99,
        sku: 'ACC-005',
        userId: demoUser._id,
      },
      {
        name: 'HDMI 2.1 Cable',
        description: '8K HDMI 2.1 cable ultra high speed 10ft',
        category: 'Accessories',
        quantity: 25,
        lowStockThreshold: 8,
        unitPrice: 24.99,
        sku: 'ACC-006',
        userId: demoUser._id,
      },
      {
        name: 'Desk Lamp LED',
        description: 'BenQ e-Reading Lamp auto brightness',
        category: 'Office',
        quantity: 6,
        lowStockThreshold: 2,
        unitPrice: 89.99,
        sku: 'OFF-001',
        userId: demoUser._id,
      },
      {
        name: 'Thunderbolt Dock',
        description: '14-in-1 Thunderbolt Dock multi port',
        category: 'Electronics',
        quantity: 3,
        lowStockThreshold: 2,
        unitPrice: 299.99,
        sku: 'ELEC-004',
        userId: demoUser._id,
      },
      {
        name: 'Portable SSD 2TB',
        description: 'Samsung T7 Shield 2TB Portable SSD',
        category: 'Storage',
        quantity: 11,
        lowStockThreshold: 2,
        unitPrice: 199.99,
        sku: 'STOR-001',
        userId: demoUser._id,
      },
      {
        name: 'USB Hub 4-Port',
        description: '4-Port USB 3.0 Hub high speed',
        category: 'Accessories',
        quantity: 18,
        lowStockThreshold: 5,
        unitPrice: 29.99,
        sku: 'ACC-007',
        userId: demoUser._id,
      },
      {
        name: 'Wireless Charging Pad',
        description: 'Qi wireless charging pad 15W',
        category: 'Accessories',
        quantity: 9,
        lowStockThreshold: 3,
        unitPrice: 34.99,
        sku: 'ACC-008',
        userId: demoUser._id,
      },
      {
        name: 'Desk Mat Extended',
        description: 'Large extended mouse pad desk mat 36x16',
        category: 'Office',
        quantity: 4,
        lowStockThreshold: 2,
        unitPrice: 44.99,
        sku: 'OFF-002',
        userId: demoUser._id,
      },
    ]);

    logger.info(`✅ Created ${items.length} inventory items`);

    // Create stock movements
    const movements = [];
    
    for (const item of items) {
      // Add initial stock IN movement
      movements.push({
        itemId: item._id,
        type: 'IN',
        quantity: item.quantity,
        reason: 'Initial stock',
        notes: 'Database seed - initial inventory',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        userId: demoUser._id,
      });

      // Add some random OUT movements (sales)
      if (item.quantity > 0) {
        const saleQty = Math.floor(Math.random() * Math.min(5, item.quantity)) + 1;
        movements.push({
          itemId: item._id,
          type: 'OUT',
          quantity: saleQty,
          reason: 'Sales',
          notes: 'Customer purchase',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          userId: demoUser._id,
        });
      }

      // Add restock movements for some items
      if (Math.random() > 0.5) {
        movements.push({
          itemId: item._id,
          type: 'IN',
          quantity: Math.floor(Math.random() * 20) + 5,
          reason: 'Restock',
          notes: 'Bulk purchase from supplier',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          userId: demoUser._id,
        });
      }
    }

    await StockMovement.insertMany(movements);
    logger.info(`✅ Created ${movements.length} stock movements`);

    logger.info('\\n' + '='.repeat(50));
    logger.info('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    logger.info('='.repeat(50));
    console.log('\\n📊 Demo Account Credentials:');
    console.log('   Email: demo@stockpilot.com');
    console.log('   Password: demo123456');
    console.log('\\n📦 Inventory Created: 15 items with realistic data');
    console.log('📈 Stock Movements: 30+ transactions recorded\\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding error:', error.message);
    logger.error('Full error:', error);
    process.exit(1);
  }
};

seedData();
