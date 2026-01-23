import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { RequestWithTenant } from '../../tenant/tenant.middleware';
import { Types } from 'mongoose';

/**
 * @TenantId() Decorator
 *
 * Extracts tenant ID from the request object.
 * Automatically handles type conversion and validation.
 *
 * @returns MongoDB ObjectId of the current tenant
 * @throws BadRequestException if tenant ID is not available
 *
 * @example
 * @Get()
 * async findAll(@TenantId() tenantId: Types.ObjectId) {
 *     return this.service.findAll(tenantId);
 * }
 */
export const TenantId = createParamDecorator((data: unknown, ctx: ExecutionContext): Types.ObjectId => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();

    if (!request.tenant) {
        throw new BadRequestException('Tenant context not found');
    }

    if (!request.tenant._id) {
        throw new BadRequestException('Tenant ID not found');
    }

    return request.tenant._id;
});

/**
 * @TenantIdString() Decorator
 *
 * Extracts tenant ID from the request object as a string.
 * Useful when you need the string representation instead of ObjectId.
 *
 * @returns String representation of tenant ID
 * @throws BadRequestException if tenant ID is not available
 *
 * @example
 * @Get()
 * async findAll(@TenantIdString() tenantId: string) {
 *     return this.service.findAll(tenantId);
 * }
 */
export const TenantIdString = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();

    if (!request.tenant) {
        throw new BadRequestException('Tenant context not found');
    }

    if (!request.tenant._id) {
        throw new BadRequestException('Tenant ID not found');
    }

    return request.tenant._id.toString();
});
