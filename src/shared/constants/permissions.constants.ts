// src/shared/constants/permissions.constants.ts

/**
 * Permission codes as constants for type-safe usage in decorators
 */
export const PERMISSION_CODES = {
    // Role Management
    ROLE_GET_ALL: 'role.getAll',
    ROLE_GET_BY_ID: 'role.getById',
    ROLE_CREATE: 'role.create',
    ROLE_UPDATE: 'role.update',
    ROLE_DELETE: 'role.delete',
    ROLE_ASSIGN: 'role.assign',
    ROLE_GET_USER_ROLES: 'role.getUserRoles',
    ROLE_TOGGLE_ROLE_PERMISSION: 'role.toggleRolePermission',

    // Permission Management
    PERMISSION_GET_ALL: 'permission.getAll',
    PERMISSION_GET_BY_ID: 'permission.getById',
    PERMISSION_GET_GROUPS: 'permission.getGroups',
    PERMISSION_CREATE: 'permission.create',
    PERMISSION_UPDATE: 'permission.update',
    PERMISSION_DELETE: 'permission.delete',

    // Audit Log
    AUDIT_LOG_GET_ALL: 'auditLog.getAll',
    AUDIT_LOG_GET_BY_ID: 'auditLog.getById',
    AUDIT_LOG_ROLLBACK: 'auditLog.rollback',

    // Notification
    NOTIFICATION_GET_MY: 'notification.getMy',
    NOTIFICATION_GET_BY_USER_ID: 'notification.getByUserId',
    NOTIFICATION_MARK_READ: 'notification.markRead',
    NOTIFICATION_DELETE: 'notification.delete',
    NOTIFICATION_SEND: 'notification.send',
} as const;

/**
 * Permission definitions for seeding and role management
 */
export const PERMISSIONS = [
    // ===================================
    // ROLE MANAGEMENT
    // ===================================
    {
        code: 'role.getAll',
        name: 'Xem danh sách vai trò',
        description: 'Xem danh sách và thông tin vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role.getById',
        name: 'Xem chi tiết vai trò',
        description: 'Xem chi tiết một vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role.create',
        name: 'Tạo vai trò',
        description: 'Tạo vai trò mới trong hệ thống',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role.update',
        name: 'Cập nhật vai trò',
        description: 'Chỉnh sửa thông tin vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role.delete',
        name: 'Xóa vai trò',
        description: 'Xóa vai trò khỏi hệ thống',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role.assign',
        name: 'Quản lý quyền của vai trò',
        description: 'Gán và thu hồi quyền cho vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role.getUserRoles',
        name: 'Xem vai trò người dùng',
        description: 'Xem các vai trò được gán cho người dùng',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'role.toggleRolePermission',
        name: 'Quản lý quyền của vai trò',
        description: 'Bật/tắt quyền cho vai trò',
        group: 'ROLE_MANAGEMENT',
        isSystem: true,
    },
    // ===================================
    // PERMISSION MANAGEMENT
    // ===================================
    {
        code: 'permission.getAll',
        name: 'Xem danh sách quyền',
        description: 'Xem danh sách và thông tin quyền',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission.getById',
        name: 'Xem chi tiết quyền',
        description: 'Xem chi tiết một quyền',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission.getGroups',
        name: 'Xem nhóm quyền',
        description: 'Xem danh sách các nhóm quyền',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission.create',
        name: 'Tạo quyền',
        description: 'Tạo quyền mới trong hệ thống',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission.update',
        name: 'Cập nhật quyền',
        description: 'Chỉnh sửa thông tin quyền',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },
    {
        code: 'permission.delete',
        name: 'Xóa quyền',
        description: 'Xóa quyền khỏi hệ thống',
        group: 'PERMISSION_MANAGEMENT',
        isSystem: true,
    },

    // ===================================
    // AUDIT LOG
    // ===================================
    {
        code: 'auditLog.getAll',
        name: 'Xem danh sách audit logs',
        description: 'Xem tất cả các audit logs trong hệ thống với pagination và filter',
        group: 'AUDIT_LOG',
        isSystem: true,
    },
    {
        code: 'auditLog.getById',
        name: 'Xem chi tiết audit log',
        description: 'Xem chi tiết một audit log cụ thể',
        group: 'AUDIT_LOG',
        isSystem: true,
    },
    {
        code: 'auditLog.rollback',
        name: 'Rollback audit log',
        description: 'Khôi phục dữ liệu từ audit log',
        group: 'AUDIT_LOG',
        isSystem: true,
    },

    // ===================================
    // NOTIFICATION
    // ===================================
    {
        code: 'notification.getMy',
        name: 'Xem thông báo của tôi',
        description: 'Xem danh sách thông báo của người dùng hiện tại',
        group: 'NOTIFICATION',
        isSystem: false,
    },
    {
        code: 'notification.getByUserId',
        name: 'Xem thông báo theo user ID',
        description: 'Xem thông báo của người dùng khác (admin)',
        group: 'NOTIFICATION',
        isSystem: true,
    },
    {
        code: 'notification.markRead',
        name: 'Đánh dấu đã đọc',
        description: 'Đánh dấu thông báo đã đọc',
        group: 'NOTIFICATION',
        isSystem: false,
    },
    {
        code: 'notification.delete',
        name: 'Xóa thông báo',
        description: 'Xóa thông báo của mình',
        group: 'NOTIFICATION',
        isSystem: false,
    },
    {
        code: 'notification.send',
        name: 'Gửi thông báo',
        description: 'Gửi thông báo đến người dùng',
        group: 'NOTIFICATION',
        isSystem: true,
    },
];
