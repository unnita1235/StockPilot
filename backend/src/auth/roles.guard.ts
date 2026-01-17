import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole, ROLE_PERMISSIONS } from './user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No role restriction
        }

        const { user } = context.switchToHttp().getRequest();
        
        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        const userRole = user.role || 'viewer';
        const hasRole = requiredRoles.includes(userRole);

        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole}`
            );
        }

        return true;
    }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        const userRole: UserRole = user?.role || 'viewer';
        const userPermissions: readonly string[] = ROLE_PERMISSIONS[userRole] || [];

        const hasPermission = requiredPermissions.every(
            permission => userPermissions.includes(permission)
        );

        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
