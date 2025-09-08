// src/shared/constants/roles.constant.ts

/**
 * Role constants để sử dụng trong decorators và guards
 */
export const ROLE_NAMES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
    MODERATOR: 'MODERATOR',
    VIEWER: 'VIEWER',
    PERMISSIONS_USER: 'PERMISSIONS_USER',
    ROLLBACK_LOG: 'ROLLBACK_LOG'
} as const;

/**
 * Role IDs từ database
 */
export const ROLE_IDS = {
    SUPER_ADMIN: 1,
    ADMIN: 2,
    TEACHER: 3,
    STUDENT: 4,
    MODERATOR: 5,
    VIEWER: 6
} as const;

/**
 * Roles có quyền cao nhất (bypass tất cả permissions)
 */
export const SUPER_ROLES = [
    ROLE_NAMES.SUPER_ADMIN
] as const;

/**
 * Roles quản trị
 */
export const ADMIN_ROLES = [
    ROLE_NAMES.SUPER_ADMIN,
    ROLE_NAMES.ADMIN
] as const;

/**
 * Roles có thể tạo/sửa nội dung
 */
export const CONTENT_CREATOR_ROLES = [
    ROLE_NAMES.SUPER_ADMIN,
    ROLE_NAMES.ADMIN,
    ROLE_NAMES.TEACHER
] as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];
export type RoleId = typeof ROLE_IDS[keyof typeof ROLE_IDS];
