// src/shared/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common'
import { applyDecorators, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../guards/auth.guard'
import { PermissionsGuard } from '../guards/permissions.guard'

export const PERMISSIONS_KEY = 'permissions'

export const RequirePermission = (...permissions: string[]) => {
    return applyDecorators(
        UseGuards(AuthGuard, PermissionsGuard),
        RequirePermissions(...permissions),
    )
}

/**
 * Decorator để đánh dấu permissions cần thiết để truy cập endpoint
 * @param permissions - Danh sách permission codes (e.g., 'USER_VIEW', 'USER_CREATE')
 * 
 * @example
 * @RequirePermissions('USER_VIEW')
 * @RequirePermissions('USER_CREATE', 'USER_UPDATE')
 */
export const RequirePermissions = (...permissions: string[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions)

/**
 * Decorator để yêu cầu ít nhất một trong các permissions
 * Alias cho RequirePermissions (vì default behavior là OR)
 */
export const RequireAnyPermission = (...permissions: string[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions)

