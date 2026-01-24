const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001/api';

async function verifyStocks() {
    try {
        console.log('🚀 Starting Stock API Verification...');

        const uniqueEmail = `test_stock_${Date.now()}@example.com`;

        // 1. Try to register directly (skip login for predictable test flow)
        console.log('\n🔐 Registering new user...');
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
            email: uniqueEmail,
            password: 'password123',
            name: 'Test User'
        });
        const token = registerRes.data.data.token;
        console.log(`✅ Registration successful for ${uniqueEmail}`);

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Add a Position
        console.log('\n➕ Adding Stock Position (AAPL)...');
        const addRes = await axios.post(`${BASE_URL}/portfolio/positions`, {
            symbol: 'AAPL',
            quantity: 10,
            buyPrice: 150.00
        }, { headers });
        console.log('✅ Added AAPL:', addRes.data);
        const positionId = addRes.data._id;

        // 3. Get Portfolio
        console.log('\n📊 Fetching Portfolio...');
        const portRes = await axios.get(`${BASE_URL}/portfolio`, { headers });
        console.log('✅ Portfolio Summary:', portRes.data.summary);
        console.log('✅ Portfolio Positions:', portRes.data.positions.length);

        if (portRes.data.positions[0].symbol !== 'AAPL') {
            throw new Error('Stock symbol mismatch');
        }

        // 3a. Test Validation (Negative Quantity)
        console.log('\n🧪 Testing Input Validation (Negative Qty)...');
        try {
            await axios.post(`${BASE_URL}/portfolio/positions`, {
                symbol: 'BAD',
                quantity: -5,
                buyPrice: 100
            }, { headers });
            throw new Error('Validation failed: Should have rejected negative quantity');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log('✅ Validation worked: Rejected negative quantity');
            } else {
                throw err;
            }
        }

        // 4. Update Position
        console.log('\n📝 Updating Position...');
        const updateRes = await axios.put(`${BASE_URL}/portfolio/positions/${positionId}`, {
            quantity: 20
        }, { headers });
        console.log('✅ Updated Quantity:', updateRes.data.quantity);

        if (updateRes.data.quantity !== 20) throw new Error('Update failed');

        // 5. Delete Position
        console.log('\n🗑️ Deleting Position...');
        await axios.delete(`${BASE_URL}/portfolio/positions/${positionId}`, { headers });
        console.log('✅ Deleted Position');

        // 6. Verify Deletion
        const finalPortRes = await axios.get(`${BASE_URL}/portfolio`, { headers });
        if (finalPortRes.data.positions.length !== 0) {
            throw new Error('Position was not deleted');
        }
        console.log('✅ Verification Completed Successfully!');

    } catch (error) {
        console.error('❌ Verification Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received:', error.message);
        } else {
            console.error('Error Message:', error.message);
        }
        process.exit(1);
    }
}

verifyStocks();
