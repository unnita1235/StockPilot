import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface DatabaseHealthStatus {
    status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'unknown';
    connected: boolean;
    readyState: number;
    host?: string;
    name?: string;
    lastError?: string;
    lastErrorTime?: Date;
    connectionAttempts: number;
    uptime?: number;
    isHealthy: boolean;
}

@Injectable()
export class DatabaseHealthService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseHealthService.name);
    private lastError: string | null = null;
    private lastErrorTime: Date | null = null;
    private connectionAttempts = 0;
    private connectionStartTime: Date | null = null;

    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) {}

    async onModuleInit() {
        // Set up event listeners for connection monitoring
        this.setupConnectionListeners();

        // Log initial connection status
        this.logger.log('Database Health Service initialized');
        const status = await this.getConnectionStatus();
        this.logger.log(`Initial database status: ${status.status}`);
    }

    private setupConnectionListeners() {
        this.connection.on('connected', () => {
            this.connectionStartTime = new Date();
            this.lastError = null;
            this.lastErrorTime = null;
            this.logger.log('✅ MongoDB connected successfully');
            this.logger.log(`   Host: ${this.connection.host}`);
            this.logger.log(`   Database: ${this.connection.name}`);
        });

        this.connection.on('connecting', () => {
            this.connectionAttempts++;
            this.logger.log(`🔄 MongoDB connecting... (attempt ${this.connectionAttempts})`);
        });

        this.connection.on('disconnected', () => {
            this.logger.warn('⚠️  MongoDB disconnected - will attempt to reconnect');
            this.connectionStartTime = null;
        });

        this.connection.on('reconnected', () => {
            this.connectionStartTime = new Date();
            this.lastError = null;
            this.lastErrorTime = null;
            this.logger.log('🔄 MongoDB reconnected successfully');
        });

        this.connection.on('error', (err) => {
            this.lastError = err.message;
            this.lastErrorTime = new Date();
            this.logger.error('❌ MongoDB connection error:', err.message);

            // Log additional details for specific error types
            if (err.name === 'MongoNetworkError') {
                this.logger.error('   Network error - check MongoDB server availability');
            } else if (err.name === 'MongoServerError') {
                this.logger.error('   Server error - check MongoDB server logs');
            } else if (err.name === 'MongooseServerSelectionError') {
                this.logger.error('   Server selection error - check connection string and network');
            }
        });

        this.connection.on('close', () => {
            this.logger.warn('🔒 MongoDB connection closed');
            this.connectionStartTime = null;
        });

        this.connection.on('reconnectFailed', () => {
            this.logger.error('💥 MongoDB reconnection failed - all retry attempts exhausted');
        });
    }

    /**
     * Get current database connection status with detailed information
     */
    async getConnectionStatus(): Promise<DatabaseHealthStatus> {
        try {
            const readyState = this.connection.readyState;
            let status: DatabaseHealthStatus['status'];
            let connected = false;

            // MongoDB connection states:
            // 0 = disconnected
            // 1 = connected
            // 2 = connecting
            // 3 = disconnecting
            // 99 = uninitialized

            switch (readyState) {
                case 1:
                    status = 'connected';
                    connected = true;
                    break;
                case 2:
                    status = 'connecting';
                    break;
                case 0:
                    status = 'disconnected';
                    break;
                case 3:
                    status = 'disconnected';
                    break;
                default:
                    status = 'unknown';
            }

            // If we have a recent error, mark as error state
            if (this.lastError && this.lastErrorTime) {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                if (this.lastErrorTime > fiveMinutesAgo) {
                    status = 'error';
                }
            }

            const uptime = this.connectionStartTime
                ? Math.floor((Date.now() - this.connectionStartTime.getTime()) / 1000)
                : undefined;

            const isHealthy = connected && status === 'connected';

            return {
                status,
                connected,
                readyState,
                host: this.connection.host || undefined,
                name: this.connection.name || undefined,
                lastError: this.lastError || undefined,
                lastErrorTime: this.lastErrorTime || undefined,
                connectionAttempts: this.connectionAttempts,
                uptime,
                isHealthy,
            };
        } catch (error) {
            this.logger.error('Error getting connection status:', error);
            return {
                status: 'error',
                connected: false,
                readyState: -1,
                lastError: error.message,
                lastErrorTime: new Date(),
                connectionAttempts: this.connectionAttempts,
                isHealthy: false,
            };
        }
    }

    /**
     * Check if database is connected and healthy
     */
    async isHealthy(): Promise<boolean> {
        const status = await this.getConnectionStatus();
        return status.isHealthy;
    }

    /**
     * Perform a simple ping test to verify database connectivity
     */
    async ping(): Promise<boolean> {
        try {
            if (this.connection.readyState !== 1) {
                return false;
            }

            // Try to execute a simple command
            await this.connection.db.admin().ping();
            return true;
        } catch (error) {
            this.logger.error('Database ping failed:', error.message);
            return false;
        }
    }

    /**
     * Get detailed connection statistics
     */
    async getConnectionStats(): Promise<{
        isConnected: boolean;
        readyState: number;
        uptime: number | null;
        totalAttempts: number;
        hasRecentErrors: boolean;
        lastError?: string;
    }> {
        const status = await this.getConnectionStatus();

        return {
            isConnected: status.connected,
            readyState: status.readyState,
            uptime: status.uptime || null,
            totalAttempts: this.connectionAttempts,
            hasRecentErrors: !!status.lastError,
            lastError: status.lastError,
        };
    }

    /**
     * Reset error tracking (useful after manual intervention)
     */
    resetErrorTracking() {
        this.lastError = null;
        this.lastErrorTime = null;
        this.connectionAttempts = 0;
        this.logger.log('Error tracking reset');
    }
}
