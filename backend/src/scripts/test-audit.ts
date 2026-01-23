import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { InventoryModule } from '../inventory/inventory.module';
import { AuditModule } from '../audit/audit.module';
import { InventoryService } from '../inventory/inventory.service';
import { AuditLog } from '../audit/audit.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../common/mongoose/tenant-isolation.plugin';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockpilot', {
            connectionFactory: (connection) => {
                connection.plugin(tenantIsolationPlugin);
                return connection;
            },
        }),
        InventoryModule,
        AuditModule,
    ],
})
class TestModule { }

async function bootstrap() {
    console.log('🚀 Starting Audit Log Verification...');

    // Create context with TestModule instead of AppModule
    const app = await NestFactory.createApplicationContext(TestModule, { logger: ['error', 'warn', 'log'] });
    const inventoryService = app.get(InventoryService);
    const auditModel = app.get<Model<AuditLog>>(getModelToken(AuditLog.name));

    // Cleanup previous test data
    console.log('🧹 Cleaning up test data...');
    const tenantId = new Types.ObjectId();
    const testSku = `TEST-AUDIT-${Date.now()}`;

    try {
        // 1. Create
        console.log('📝 Testing Create...');
        const newItem = await inventoryService.create({
            name: 'Test Audit Item',
            sku: testSku,
            category: 'Test',
            quantity: 10,
            lowStockThreshold: 5
        }, tenantId);
        console.log(`✅ Created item: ${newItem._id}`);

        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for async log

        const createLog = await auditModel.findOne({
            entityId: newItem._id.toString(),
            action: 'CREATE'
        }).exec();

        if (createLog) {
            console.log('✅ Audit Create found!');
        } else {
            console.error('❌ Audit Create NOT found!');
        }

        // 2. Update
        console.log('📝 Testing Update...');
        await inventoryService.update(newItem._id.toString(), {
            name: 'Updated Audit Item Name'
        }, tenantId);
        console.log('✅ Updated item');

        await new Promise(resolve => setTimeout(resolve, 500));

        const updateLog = await auditModel.findOne({
            entityId: newItem._id.toString(),
            action: 'UPDATE'
        }).exec();

        if (updateLog) {
            console.log('✅ Audit Update found!');
            if (updateLog.oldValue.name === 'Test Audit Item' && updateLog.newValue.name === 'Updated Audit Item Name') {
                console.log('✅ Old/New values correct!');
            } else {
                console.error('❌ Old/New values mismatch!');
            }
        } else {
            console.error('❌ Audit Update NOT found!');
        }

        // 3. Delete
        console.log('📝 Testing Delete...');
        await inventoryService.remove(newItem._id.toString(), tenantId);

        await new Promise(resolve => setTimeout(resolve, 500));

        const deleteLog = await auditModel.findOne({
            entityId: newItem._id.toString(),
            action: 'DELETE'
        }).exec();

        if (deleteLog) {
            console.log('✅ Audit Delete found!');
        } else {
            console.error('❌ Audit Delete NOT found!');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await app.close();
        console.log('🏁 Verification Finished');
        process.exit(0);
    }
}

bootstrap();
