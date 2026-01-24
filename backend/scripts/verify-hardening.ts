
import axios from 'axios';

const BASE_URL = 'http://localhost:3005/api';

async function verifyHardening() {
    console.log('Starting hardening verification...');

    // 1. Verify 404 JSON Response
    try {
        console.log('\nTesting 404 JSON Response...');
        await axios.get(`${BASE_URL}/unknown-route-xyz`);
    } catch (error: any) {
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log('Headers:', error.response.headers['content-type']);
            console.log('Body:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 404 &&
                error.response.headers['content-type']?.includes('application/json')) {
                console.log('✅ 404 check PASSED: Received JSON 404.');
            } else {
                console.log('❌ 404 check FAILED: status or content-type mismatch.');
            }
        } else {
            console.log('❌ 404 check FAILED: No response received.', error.message);
        }
    }

    // 2. Verify Rate Limiting (Auth)
    console.log('\nTesting Auth Rate Limiting (limit: 10/min)...');
    let blocked = false;
    for (let i = 1; i <= 15; i++) {
        try {
            // Use a dummy login endpoint or just verify headers if possible. 
            // We expect 401 Unauthorized for valid requests (missing creds) or 429 when limited.
            await axios.post(`${BASE_URL}/auth/login`, {
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            console.log(`Request ${i}: OK (Expected 401/200, got 200)`);
        } catch (error: any) {
            if (error.response) {
                if (error.response.status === 429) {
                    console.log(`Request ${i}: BLOCKED (429 Too Many Requests)`);
                    blocked = true;
                    break;
                } else {
                    // 401 is expected for wrong password
                    console.log(`Request ${i}: Request processed (${error.response.status})`);
                }
            } else {
                console.log(`Request ${i}: Error ${error.message}`);
            }
        }
    }

    if (blocked) {
        console.log('✅ Rate limiting check PASSED: Requests were blocked.');
    } else {
        console.log('❌ Rate limiting check FAILED: No requests were blocked after 15 attempts.');
    }
}

verifyHardening();
