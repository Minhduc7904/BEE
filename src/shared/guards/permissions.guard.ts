// src/shared/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { AuthenticatedUser } from '../../infrastructure/services/auth.service'
import { ROLE_NAMES } from '../constants/roles.constant'

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ])

        // Nếu không có permission requirements thì cho phép truy cập
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true
        }

        const request = context.switchToHttp().getRequest()
        const user: AuthenticatedUser = request.user

        if (!user) {
            throw new ForbiddenException('User not found')
        }

        // SUPER_ADMIN có quyền truy cập tất cả API (bypass permission check)
        const isSuperAdmin = user.roles?.some((role) => role.name === ROLE_NAMES.SUPER_ADMIN)

        if (isSuperAdmin) {
            return true
        }

        // Kiểm tra permissions
        if (!user.permissions || user.permissions.length === 0) {
            throw new ForbiddenException('User has no permissions')
        }

        // Lấy danh sách permission codes của user
        const userPermissionCodes = user.permissions.map((p) => p.code)

        // Kiểm tra user có ít nhất một permission được yêu cầu không
        const hasRequiredPermission = requiredPermissions.some((requiredPermission) => {
            return userPermissionCodes.includes(requiredPermission)
        })

        if (!hasRequiredPermission) {
            throw new ForbiddenException(
                `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
            )
        }

        return true
    }
}
