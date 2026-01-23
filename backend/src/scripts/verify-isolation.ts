
import 'dotenv/config';
import mongoose, { Schema } from 'mongoose';
import { TenantContext } from '../common/providers/tenant-context.provider';
import { tenantIsolationPlugin } from '../common/mongoose/tenant-isolation.plugin';

async function run() {
    // 1. Setup
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockpilot_test_isolation';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Define a test schema
    const TestSchema = new Schema({
        name: String,
        tenantId: { type: Schema.Types.ObjectId, index: true },
    });

    // Apply the plugin
    TestSchema.plugin(tenantIsolationPlugin);

    const TestModel = mongoose.model('TestRequest', TestSchema);

    // clear previous data
    await TestModel.deleteMany({});

    // 2. Create Data for Tenant A and Tenant B
    const tenantAId = new mongoose.Types.ObjectId().toString();
    const tenantBId = new mongoose.Types.ObjectId().toString();

    // We need to bypass the plugin to seed data for specific tenants, 
    // OR just use the context to seed them correctly.

    console.log(`\nSeeding data...`);
    await TenantContext.run(tenantAId, async () => {
        await TestModel.create({ name: 'Item for Tenant A' });
        console.log('Created Item A');
    });

    await TenantContext.run(tenantBId, async () => {
        await TestModel.create({ name: 'Item for Tenant B' });
        console.log('Created Item B');
    });

    // 3. Verification

    console.log(`\nVerifying Isolation...`);

    // Test A: Access as Tenant A
    await TenantContext.run(tenantAId, async () => {
        const items = await TestModel.find({});
        console.log(`[Tenant A Context] Found ${items.length} items.`);
        if (items.length === 1 && items[0].name === 'Item for Tenant A') {
            console.log('✅ PASS: Tenant A sees only their data.');
        } else {
            console.error('❌ FAIL: Tenant A saw unexpected data:', items);
        }
    });

    // Test B: Access as Tenant B
    await TenantContext.run(tenantBId, async () => {
        const items = await TestModel.find({});
        console.log(`[Tenant B Context] Found ${items.length} items.`);
        if (items.length === 1 && items[0].name === 'Item for Tenant B') {
            console.log('✅ PASS: Tenant B sees only their data.');
        } else {
            console.error('❌ FAIL: Tenant B saw unexpected data:', items);
        }
    });

    // Test C: No Context (Should see nothing or error depending on design, 
    // but in our design, find({}) without context might return everything if we didn't enforce it to fail or skip.
    // However, our plugin logic says: if (tenantId) -> apply filter.
    // If NO tenantId, the plugin does NOTHING.
    // This implies that internal "admin" jobs without context see EVERYTHING.
    // Let's verify this behavior is as expected.

    const allItems = await TestModel.find({});
    console.log(`[No Context] Found ${allItems.length} items.`);
    if (allItems.length === 2) {
        console.log('ℹ️ INFO: No context returns all data (Admin mode behaviour).');
    }

    await mongoose.disconnect();
}

TenantContext.run('init', run); // wrapping run just to be safe, though run uses its own contexts
