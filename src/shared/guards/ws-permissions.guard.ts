// src/shared/guards/ws-permissions.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { WS_PERMISSIONS_KEY } from '../decorators/ws-permissions.decorator'
import { AuthenticatedUser } from '../../infrastructure/services/auth.service'
import { ROLE_NAMES } from '../constants/roles.constant'

/**
 * WebSocket Permissions Guard
 * 
 * Validates that the authenticated user has required permissions
 * for WebSocket event handlers
 * 
 * @layer Shared/Guards
 */
@Injectable()
export class WsPermissionsGuard implements CanActivate {
    private readonly logger = new Logger(WsPermissionsGuard.name)

    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            WS_PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()]
        )

        // No permission requirements - allow access
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true
        }

        const client: Socket = context.switchToWs().getClient()
        const user: AuthenticatedUser = client.data.user

        if (!user) {
            this.logger.warn(`Permission denied: User not authenticated`)
            throw new WsException({
                message: 'Authentication required',
                code: 'UNAUTHORIZED',
            })
        }

        // SUPER_ADMIN bypass - has access to everything
        const isSuperAdmin = user.roles?.some((role) => role.name === ROLE_NAMES.SUPER_ADMIN)

        if (isSuperAdmin) {
            this.logger.debug(`Permission granted: User ${user.userId} is SUPER_ADMIN`)
            return true
        }

        // Check user permissions
        if (!user.permissions || user.permissions.length === 0) {
            this.logger.warn(`Permission denied: User ${user.userId} has no permissions`)
            throw new WsException({
                message: 'Access denied: No permissions',
                code: 'FORBIDDEN',
            })
        }

        // Get user permission codes
        const userPermissionCodes = user.permissions.map((p) => p.code)

        // Check if user has at least one required permission (OR logic)
        const hasRequiredPermission = requiredPermissions.some((requiredPermission) =>
            userPermissionCodes.includes(requiredPermission)
        )

        if (!hasRequiredPermission) {
            this.logger.warn(
                `Permission denied: User ${user.userId} lacks permissions [${requiredPermissions.join(', ')}]`
            )
            throw new WsException({
                message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
                code: 'FORBIDDEN',
            })
        }

        this.logger.debug(`Permission granted: User ${user.userId} has required permissions`)
        return true
    }
}
