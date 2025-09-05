// src/shared/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../../infrastructure/services/auth.service';
import { ROLE_NAMES, ROLE_IDS } from '../constants/roles.constant';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<(string | number)[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Nếu không có role requirements thì cho phép truy cập
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user || !user.roles) {
            throw new ForbiddenException('User roles not found');
        }

        // SUPER_ADMIN có quyền truy cập tất cả API
        const isSuperAdmin = user.roles.some(role => 
            role.name === ROLE_NAMES.SUPER_ADMIN || role.id === ROLE_IDS.SUPER_ADMIN
        );

        if (isSuperAdmin) {
            return true; // SUPER_ADMIN bypass tất cả permission checks
        }

        // Kiểm tra user có ít nhất một role được phép không
        const hasRequiredRole = requiredRoles.some(requiredRole => {
            return user.roles?.some(userRole => {
                // Kiểm tra theo role name hoặc role ID
                return userRole.name === requiredRole || userRole.id === requiredRole;
            });
        });

        if (!hasRequiredRole) {
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}`
            );
        }

        return true;
    }
}
