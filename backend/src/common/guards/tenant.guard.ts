import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithTenant } from '../../tenant/tenant.middleware';
import { TenantContext } from '../providers/tenant-context.provider';

export const TENANT_REQUIRED_KEY = 'tenantRequired';

/**
 * TenantGuard - Enforces tenant scope on protected routes
 *
 * This guard ensures:
 * 1. Tenant is present in request (from middleware)
 * 2. Tenant ID is valid and active
 * 3. Tenant context is properly set in AsyncLocalStorage
 * 4. All operations are scoped to the authenticated tenant
 *
 * Usage:
 * @RequireTenant()
 * @Get()
 * async findAll() { ... }
 */
@Injectable()
export class TenantGuard implements CanActivate {
    private readonly logger = new Logger(TenantGuard.name);

    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if @RequireTenant() decorator is present
        const requireTenant = this.reflector.getAllAndOverride<boolean>(TENANT_REQUIRED_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If decorator is not present, allow access (opt-in security)
        if (requireTenant === undefined) {
            return true;
        }

        // If decorator explicitly set to false, allow access
        if (requireTenant === false) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RequestWithTenant>();

        // Validate tenant presence in request
        if (!request.tenant) {
            this.logger.error(`Tenant not found in request for ${request.method} ${request.url}`);
            throw new ForbiddenException('Tenant context is required but not found');
        }

        // Validate tenant has an ID
        if (!request.tenant._id) {
            this.logger.error(`Tenant ID is missing for ${request.method} ${request.url}`);
            throw new ForbiddenException('Invalid tenant context');
        }

        // Validate tenant is active
        if (request.tenant.status !== 'active') {
            this.logger.warn(
                `Attempted access with inactive tenant: ${request.tenant._id} (${request.tenant.status})`,
            );
            throw new ForbiddenException('Tenant is not active');
        }

        // Verify tenant context is set in AsyncLocalStorage
        const contextTenantId = TenantContext.getTenantId();
        const requestTenantId = request.tenant._id.toString();

        if (contextTenantId !== requestTenantId) {
            this.logger.error(
                `Tenant context mismatch: Context=${contextTenantId}, Request=${requestTenantId}`,
            );
            throw new ForbiddenException('Tenant context mismatch');
        }

        // Log tenant-scoped access for audit trail
        this.logger.log(
            `Tenant-scoped access: ${request.method} ${request.url} | Tenant: ${requestTenantId} (${request.tenant.name})`,
        );

        return true;
    }
}
