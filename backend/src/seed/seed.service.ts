import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../auth/user.schema';
import { Inventory, InventoryDocument } from '../inventory/inventory.schema';
import { StockMovement, StockMovementDocument } from '../stock/stock.schema';

@Injectable()
export class SeedService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
        @InjectModel(StockMovement.name) private stockModel: Model<StockMovementDocument>,
    ) {}

    async getStatus() {
        const userCount = await this.userModel.countDocuments();
        const itemCount = await this.inventoryModel.countDocuments();
        const movementCount = await this.stockModel.countDocuments();
        
        return {
            success: true,
            data: {
                users: userCount,
                items: itemCount,
                movements: movementCount,
                isSeeded: userCount > 0 && itemCount > 0,
            }
        };
    }

    async seedDatabase(force: boolean = false) {
        const results: string[] = [];

        try {
            // Check if already seeded
            const existingUsers = await this.userModel.countDocuments();
            const existingItems = await this.inventoryModel.countDocuments();

            if (!force && existingUsers > 0 && existingItems > 0) {
                return {
                    success: true,
                    message: 'Database already seeded. Use ?force=true to reseed.',
                    data: { users: existingUsers, items: existingItems }
                };
            }

            if (force) {
                await this.userModel.deleteMany({});
                await this.inventoryModel.deleteMany({});
                await this.stockModel.deleteMany({});
                results.push('Cleared existing data');
            }

            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = await this.userModel.create({
                email: 'admin@stockpilot.com',
                password: hashedPassword,
                name: 'Admin User',
                role: 'admin',
            });
            results.push(`Created admin user: ${adminUser.email}`);

            // Create demo user
            const demoPassword = await bcrypt.hash('demo123', 10);
            const demoUser = await this.userModel.create({
                email: 'demo@stockpilot.com',
                password: demoPassword,
                name: 'Demo User',
                role: 'staff',
            });
            results.push(`Created demo user: ${demoUser.email}`);

            // Create inventory items
            const items = [
                { name: 'Laptop Dell XPS 15', description: 'High-performance laptop for professionals', quantity: 25, lowStockThreshold: 5, category: 'Electronics', unitPrice: 1299 },
                { name: 'Wireless Mouse Logitech MX', description: 'Ergonomic wireless mouse with long battery', quantity: 150, lowStockThreshold: 20, category: 'Electronics', unitPrice: 49 },
                { name: 'USB-C Hub 7-in-1', description: 'Multi-port USB-C hub with HDMI', quantity: 75, lowStockThreshold: 15, category: 'Electronics', unitPrice: 35 },
                { name: 'Monitor 27" 4K IPS', description: '4K IPS display with USB-C', quantity: 12, lowStockThreshold: 5, category: 'Electronics', unitPrice: 450 },
                { name: 'Mechanical Keyboard RGB', description: 'Cherry MX switches, RGB backlit', quantity: 3, lowStockThreshold: 10, category: 'Electronics', unitPrice: 129 },
                { name: 'Webcam HD 1080p', description: 'HD webcam with built-in microphone', quantity: 45, lowStockThreshold: 10, category: 'Electronics', unitPrice: 79 },
                { name: 'Office Chair Ergonomic', description: 'Adjustable lumbar support, mesh back', quantity: 8, lowStockThreshold: 5, category: 'Furniture', unitPrice: 299 },
                { name: 'Standing Desk Electric', description: 'Height adjustable 60x30 inch', quantity: 0, lowStockThreshold: 3, category: 'Furniture', unitPrice: 599 },
                { name: 'Notebook A5 Premium', description: 'Hardcover lined notebook 200 pages', quantity: 200, lowStockThreshold: 50, category: 'Office Supplies', unitPrice: 12 },
                { name: 'Printer Paper A4 500pk', description: 'White 80gsm printer paper', quantity: 100, lowStockThreshold: 25, category: 'Office Supplies', unitPrice: 8 },
                { name: 'Desk Lamp LED', description: 'Adjustable LED desk lamp with USB', quantity: 35, lowStockThreshold: 10, category: 'Office Supplies', unitPrice: 45 },
                { name: 'Wireless Headphones', description: 'Noise-cancelling Bluetooth headphones', quantity: 18, lowStockThreshold: 8, category: 'Electronics', unitPrice: 199 },
            ];

            const createdItems = await this.inventoryModel.insertMany(items);
            results.push(`Created ${createdItems.length} inventory items`);

            // Create stock movements for history
            const movements = [];
            const now = new Date();
            
            for (let i = 0; i < createdItems.length; i++) {
                const item = createdItems[i];
                
                // Initial stock in
                movements.push({
                    itemId: item._id,
                    type: 'IN',
                    quantity: (item.quantity as number) + 20,
                    reason: 'Initial stock purchase',
                    notes: 'Seed data - initial inventory',
                    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                });

                // Some stock out
                if ((item.quantity as number) > 5) {
                    movements.push({
                        itemId: item._id,
                        type: 'OUT',
                        quantity: 10,
                        reason: 'Customer order',
                        notes: 'Seed data - sample sale',
                        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                    });
                }

                // Recent activity
                if (i % 3 === 0) {
                    movements.push({
                        itemId: item._id,
                        type: 'OUT',
                        quantity: 5,
                        reason: 'Customer order',
                        notes: 'Recent sale',
                        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                    });
                }

                if (i % 4 === 0) {
                    movements.push({
                        itemId: item._id,
                        type: 'IN',
                        quantity: 15,
                        reason: 'Restock',
                        notes: 'Regular restock',
                        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    });
                }
            }

            await this.stockModel.insertMany(movements);
            results.push(`Created ${movements.length} stock movements`);

            return {
                success: true,
                message: 'Database seeded successfully!',
                data: {
                    results,
                    credentials: {
                        admin: { email: 'admin@stockpilot.com', password: 'admin123' },
                        demo: { email: 'demo@stockpilot.com', password: 'demo123' },
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Seed failed',
                error: error instanceof Error ? error.message : String(error),
                results,
            };
        }
    }
}
