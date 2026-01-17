import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get models
    const UserModel = app.get(getModelToken('User'));
    const InventoryModel = app.get(getModelToken('Inventory'));
    const StockMovementModel = app.get(getModelToken('StockMovement'));

    console.log('🌱 Starting database seed...');

    // Clear existing data
    await UserModel.deleteMany({});
    await InventoryModel.deleteMany({});
    await StockMovementModel.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await UserModel.create({
        email: 'admin@stockpilot.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
    });
    console.log(`✓ Created admin user (${adminUser._id})`);

    // Create inventory items - Updated to match new Schema
    const items = [
        { name: 'Laptop Dell XPS 15', description: 'High-performance laptop', quantity: 25, lowStockThreshold: 5, category: 'Electronics', unitPrice: 1299 },
        { name: 'Wireless Mouse Logitech', description: 'Ergonomic wireless mouse', quantity: 150, lowStockThreshold: 20, category: 'Electronics', unitPrice: 49 },
        { name: 'USB-C Hub', description: '7-in-1 USB-C hub', quantity: 75, lowStockThreshold: 15, category: 'Electronics', unitPrice: 35 },
        { name: 'Monitor 27" 4K', description: '4K IPS display monitor', quantity: 12, lowStockThreshold: 5, category: 'Electronics', unitPrice: 450 },
        { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', quantity: 3, lowStockThreshold: 10, category: 'Electronics', unitPrice: 129 },
        { name: 'Webcam HD 1080p', description: 'HD webcam with microphone', quantity: 45, lowStockThreshold: 10, category: 'Electronics', unitPrice: 79 },
        { name: 'Office Chair Ergonomic', description: 'Adjustable ergonomic chair', quantity: 8, lowStockThreshold: 5, category: 'Furniture', unitPrice: 299 },
        { name: 'Standing Desk', description: 'Electric adjustable desk', quantity: 0, lowStockThreshold: 3, category: 'Furniture', unitPrice: 599 },
        { name: 'Notebook A5', description: 'Premium lined notebook', quantity: 200, lowStockThreshold: 50, category: 'Office Supplies', unitPrice: 12 },
        { name: 'Printer Paper A4', description: 'Pack of 500 sheets', quantity: 100, lowStockThreshold: 25, category: 'Office Supplies', unitPrice: 8 },
    ];

    const createdItems = await InventoryModel.insertMany(items);
    console.log(`✓ Created ${createdItems.length} inventory items`);

    // Create stock movements for history
    const movements = [];
    for (const item of createdItems) {
        movements.push({
            itemId: item._id,
            type: 'IN',
            quantity: item.quantity + 10,
            reason: 'Initial stock',
            notes: 'Seed data',
        });
        if (item.quantity > 5) {
            movements.push({
                itemId: item._id,
                type: 'OUT',
                quantity: 10,
                reason: 'Customer order',
                notes: 'Seed data',
            });
        }
    }

    await StockMovementModel.insertMany(movements);
    console.log(`✓ Created ${movements.length} stock movements`);

    console.log('\n🎉 Database seeding complete!');
    await app.close();
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});