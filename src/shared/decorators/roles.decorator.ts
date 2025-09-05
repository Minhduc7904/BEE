// src/shared/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator để đánh dấu roles được phép truy cập endpoint
 * @param roles - Danh sách role names hoặc role IDs được phép
 */
export const Roles = (...roles: (string | number)[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator để đánh dấu roles bằng tên
 * @param roleNames - Danh sách role names
 */
export const RequireRoles = (...roleNames: string[]) => SetMetadata(ROLES_KEY, roleNames);

/**
 * Decorator để đánh dấu roles bằng ID
 * @param roleIds - Danh sách role IDs
 */
export const RequireRoleIds = (...roleIds: number[]) => SetMetadata(ROLES_KEY, roleIds);
