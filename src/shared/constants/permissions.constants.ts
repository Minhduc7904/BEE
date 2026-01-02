// src/shared/constants/permissions.constants.ts

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
];
