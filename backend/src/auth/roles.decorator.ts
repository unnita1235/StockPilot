import { SetMetadata } from '@nestjs/common';
import { UserRole } from './user.schema';

export const ROLES_KEY = 'roles';
// Accept both UserRole enum values and string literals for flexibility
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
