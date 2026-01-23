import { SetMetadata } from '@nestjs/common';
import { TENANT_REQUIRED_KEY } from '../guards/tenant.guard';

/**
 * @RequireTenant() Decorator
 *
 * Marks a route/controller as requiring tenant scope enforcement.
 * Must be used with TenantGuard.
 *
 * When applied:
 * - Tenant must be present in request
 * - Tenant must be active
 * - Tenant context must be properly set
 * - All database operations are automatically scoped to tenant
 *
 * @param required - Whether tenant is required (default: true)
 *
 * @example
 * // Require tenant on entire controller
 * @Controller('items')
 * @RequireTenant()
 * @UseGuards(TenantGuard)
 * export class InventoryController { ... }
 *
 * @example
 * // Require tenant on specific route
 * @Get()
 * @RequireTenant()
 * @UseGuards(TenantGuard)
 * async findAll() { ... }
 *
 * @example
 * // Explicitly allow access without tenant (public route)
 * @Get('public')
 * @RequireTenant(false)
 * async publicRoute() { ... }
 */
export const RequireTenant = (required: boolean = true) => SetMetadata(TENANT_REQUIRED_KEY, required);
