// src/domain/entities/role/role-permission.entity.ts

import { Role } from './role.entity'
import { Permission } from './permission.entity'

export class RolePermission {
  roleId: number
  permissionId: number

  // Navigation properties
  role?: Role
  permission?: Permission

  constructor(
    roleId: number,
    permissionId: number,
    role?: Role,
    permission?: Permission,
  ) {
    this.roleId = roleId
    this.permissionId = permissionId
    this.role = role
    this.permission = permission
  }

  /**
   * Kiểm tra xem có thông tin role không
   */
  hasRole(): boolean {
    return !!this.role
  }

  /**
   * Kiểm tra xem có thông tin permission không
   */
  hasPermission(): boolean {
    return !!this.permission
  }

  /**
   * Lấy tên role
   */
  getRoleName(): string {
    return this.role?.roleName || 'Unknown Role'
  }

  /**
   * Lấy code của permission
   */
  getPermissionCode(): string {
    return this.permission?.code || 'Unknown Permission'
  }

  /**
   * Lấy tên permission
   */
  getPermissionName(): string {
    return this.permission?.name || 'Unknown Permission'
  }

  /**
   * Kiểm tra permission có phải là system permission không
   */
  isSystemPermission(): boolean {
    return this.permission?.isSystem || false
  }

  /**
   * Tạo key duy nhất cho RolePermission
   */
  getUniqueKey(): string {
    return `${this.roleId}-${this.permissionId}`
  }
}
