// src/shared/decorators/ws-permissions.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const WS_PERMISSIONS_KEY = 'ws:permissions'

/**
 * Decorator to require permissions for WebSocket events
 * Use this on @SubscribeMessage handlers
 * 
 * @param permissions - Required permission codes
 * 
 * @example
 * @SubscribeMessage('admin-action')
 * @RequireWsPermissions('ADMIN_MANAGE')
 * handleAdminAction() { ... }
 */
export const RequireWsPermissions = (...permissions: string[]) =>
    SetMetadata(WS_PERMISSIONS_KEY, permissions)
