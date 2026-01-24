/**
 * Environment Configuration Module
 *
 * Centralized configuration that loads and validates required environment variables.
 * Exits with clear error messages if required variables are missing.
 */

import { config as dotenvConfig } from 'dotenv';

// Load .env file before anything else
dotenvConfig();

// Required environment variables
const requiredVariables = ['MONGODB_URI', 'JWT_SECRET'] as const;

// Validate required variables at startup
function validateEnvironment(): void {
    const missing: string[] = [];

    for (const variable of requiredVariables) {
        if (!process.env[variable]) {
            missing.push(variable);
        }
    }

    if (missing.length > 0) {
        console.error('='.repeat(60));
        console.error('❌ FATAL: Missing required environment variables:');
        console.error('='.repeat(60));
        missing.forEach((variable) => {
            console.error(`   - ${variable}`);
        });
        console.error('');
        console.error('Please set these variables in your .env file or environment.');
        console.error('See .env.example or README_ENV_EXAMPLE.md for reference.');
        console.error('='.repeat(60));
        process.exit(1);
    }
}

// Run validation immediately when this module is imported
validateEnvironment();

// Validated configuration object
export const config = {
    mongodb: {
        uri: process.env.MONGODB_URI as string,
    },
    jwt: {
        secret: process.env.JWT_SECRET as string,
    },
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as
        | 'development'
        | 'production'
        | 'test',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export default config;
