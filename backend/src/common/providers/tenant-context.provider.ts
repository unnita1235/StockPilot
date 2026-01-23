import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Types } from 'mongoose';

/**
 * TenantContext - Manages tenant scope using AsyncLocalStorage
 *
 * This service provides tenant context propagation throughout the entire
 * request lifecycle, including:
 * - Database queries
 * - Service calls
 * - Background jobs
 * - Event handlers
 *
 * The tenant ID is stored in AsyncLocalStorage and is automatically
 * available to all code executing within the same async context.
 */
@Injectable()
export class TenantContext {
    private static readonly logger = new Logger(TenantContext.name);
    private static storage = new AsyncLocalStorage<string>();

    /**
     * Run a callback within a tenant context
     * @param tenantId - The tenant ID to set as context
     * @param callback - The function to execute within this context
     */
    static run(tenantId: string, callback: () => void) {
        this.logger.debug(`Setting tenant context: ${tenantId}`);
        this.storage.run(tenantId, callback);
    }

    /**
     * Get the current tenant ID from context
     * @returns The tenant ID or undefined if not in a tenant context
     */
    static getTenantId(): string | undefined {
        const tenantId = this.storage.getStore();
        if (!tenantId) {
            this.logger.warn('Attempted to access tenant ID outside of tenant context');
        }
        return tenantId;
    }

    /**
     * Get the current tenant ID as MongoDB ObjectId
     * @returns The tenant ID as ObjectId or undefined
     */
    static getTenantObjectId(): Types.ObjectId | undefined {
        const tenantId = this.getTenantId();
        if (!tenantId) {
            return undefined;
        }

        try {
            return new Types.ObjectId(tenantId);
        } catch (error) {
            this.logger.error(`Invalid tenant ID format: ${tenantId}`, error);
            return undefined;
        }
    }

    /**
     * Check if we're currently in a tenant context
     * @returns true if tenant context is set
     */
    static hasTenantContext(): boolean {
        return this.storage.getStore() !== undefined;
    }

    /**
     * Require tenant context to be present
     * @throws Error if tenant context is not set
     */
    static requireTenantContext(): string {
        const tenantId = this.getTenantId();
        if (!tenantId) {
            const error = new Error('Tenant context is required but not set');
            this.logger.error(error.message);
            throw error;
        }
        return tenantId;
    }

    /**
     * Verify that the provided tenant ID matches the current context
     * @param tenantId - The tenant ID to verify
     * @throws Error if tenant ID doesn't match context
     */
    static verifyTenantMatch(tenantId: string): void {
        const contextTenantId = this.getTenantId();
        if (contextTenantId && contextTenantId !== tenantId) {
            const error = new Error(
                `Tenant ID mismatch: Expected ${contextTenantId}, got ${tenantId}`,
            );
            this.logger.error(error.message);
            throw error;
        }
    }

    /**
     * Get tenant filter for MongoDB queries
     * @returns Filter object with tenantId field
     */
    static getTenantFilter(): { tenantId: Types.ObjectId } | {} {
        const tenantId = this.getTenantObjectId();
        if (!tenantId) {
            this.logger.warn('No tenant context available for query filter');
            return {};
        }
        return { tenantId };
    }

    /**
     * Execute a function within a different tenant context
     * Useful for background jobs or admin operations
     * @param tenantId - The tenant ID to switch to
     * @param callback - The function to execute
     */
    static async runAs<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
        this.logger.debug(`Temporarily switching to tenant context: ${tenantId}`);
        return new Promise<T>((resolve, reject) => {
            this.storage.run(tenantId, async () => {
                try {
                    const result = await callback();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}
