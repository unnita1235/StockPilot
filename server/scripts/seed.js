/**
 * Database seeding script
 * Run with: node server/scripts/seed.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockpilot';

const sampleItems = [
  {
    name: 'Premium Coffee Beans',
    description: 'High-quality Arabica beans from Colombia',
    stock: 15,
    category: 'Raw Material',
    lowStockThreshold: 10,
    unitPrice: 25.99,
    sku: 'RAW-COF-001'
  },
  {
    name: 'Branded Coffee Cups',
    description: '12oz paper cups with StockPilot branding',
    stock: 80,
    category: 'Packaging Material',
    lowStockThreshold: 50,
    unitPrice: 0.15,
    sku: 'PKG-CUP-001'
  },
  {
    name: 'House Blend Drip Coffee',
    description: 'Our signature house blend, ready to serve',
    stock: 100,
    category: 'Product for Sale',
    lowStockThreshold: 20,
    unitPrice: 3.50,
    sku: 'PRD-DRP-001'
  },
  {
    name: 'Organic Milk',
    description: 'Fresh organic whole milk, 1 gallon',
    stock: 5,
    category: 'Raw Material',
    lowStockThreshold: 4,
    unitPrice: 6.99,
    sku: 'RAW-MLK-001'
  },
  {
    name: 'Cardboard Sleeves',
    description: 'Protective sleeves for hot beverages',
    stock: 35,
    category: 'Packaging Material',
    lowStockThreshold: 40,
    unitPrice: 0.05,
    sku: 'PKG-SLV-001'
  },
  {
    name: 'Chocolate Croissant',
    description: 'Freshly baked chocolate-filled croissant',
    stock: 12,
    category: 'Product for Sale',
    lowStockThreshold: 5,
    unitPrice: 4.25,
    sku: 'PRD-CRS-001'
  },
  {
    name: 'Espresso Machine Cleaner',
    description: 'Commercial-grade cleaning tablets',
    stock: 8,
    category: 'Raw Material',
    lowStockThreshold: 5,
    unitPrice: 18.00,
    sku: 'RAW-CLN-001'
  },
  {
    name: 'Paper Bags',
    description: 'Branded take-out bags, medium size',
    stock: 60,
    category: 'Packaging Material',
    lowStockThreshold: 30,
    unitPrice: 0.25,
    sku: 'PKG-BAG-001'
  },
  {
    name: 'Vanilla Syrup',
    description: 'Premium vanilla flavoring syrup, 750ml',
    stock: 9,
    category: 'Raw Material',
    lowStockThreshold: 10,
    unitPrice: 12.50,
    sku: 'RAW-VAN-001'
  },
  {
    name: 'Gift Card',
    description: 'Reloadable store gift card',
    stock: 45,
    category: 'Product for Sale',
    lowStockThreshold: 15,
    unitPrice: 0,
    sku: 'PRD-GFT-001'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Item.deleteMany({});
    await StockMovement.deleteMany({});
    console.log('Cleared existing items and movements');

    // Create items
    const createdItems = await Item.insertMany(sampleItems);
    console.log(`Created ${createdItems.length} items`);

    // Create some sample stock movements
    const movements = [];
    const now = new Date();

    for (const item of createdItems) {
      // Initial stock movement
      movements.push({
        item: item._id,
        type: 'in',
        quantity: item.stock,
        previousStock: 0,
        newStock: item.stock,
        reason: 'Initial stock',
        createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      });

      // Some random movements over the past month
      const numMovements = Math.floor(Math.random() * 10) + 3;
      for (let i = 0; i < numMovements; i++) {
        const daysAgo = Math.floor(Math.random() * 28);
        const isOut = Math.random() > 0.4;
        const qty = Math.floor(Math.random() * 5) + 1;

        if (isOut) {
          movements.push({
            item: item._id,
            type: 'out',
            quantity: qty,
            previousStock: item.stock + qty,
            newStock: item.stock,
            reason: 'Sold',
            createdAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000)
          });
        } else {
          movements.push({
            item: item._id,
            type: 'in',
            quantity: qty,
            previousStock: item.stock - qty,
            newStock: item.stock,
            reason: 'Restocked',
            createdAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000)
          });
        }
      }
    }

    await StockMovement.insertMany(movements);
    console.log(`Created ${movements.length} stock movements`);

    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@stockpilot.com' });
    if (!adminExists) {
      await User.create({
        email: 'admin@stockpilot.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      });
      console.log('Created admin user (admin@stockpilot.com / admin123)');
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
