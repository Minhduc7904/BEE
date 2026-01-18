// src/domain/entities/role/role-permission.entity.ts

import { Role } from './role.entity'
import { Permission } from './permission.entity'

export class RolePermission {
  // Composite key
  roleId: number
  permissionId: number

  // Navigation properties
  role?: Role
  permission?: Permission

  constructor(data: {
    roleId: number
    permissionId: number
    role?: Role
    permission?: Permission
  }) {
    this.roleId = data.roleId
    this.permissionId = data.permissionId
    this.role = data.role
    this.permission = data.permission
  }

  /* ===================== DOMAIN METHODS ===================== */

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

  equals(other: RolePermission): boolean {
    return (
      this.roleId === other.roleId &&
      this.permissionId === other.permissionId
    )
  }

  toJSON() {
    return {
      roleId: this.roleId,
      permissionId: this.permissionId,
    }
  }

  clone(): RolePermission {
    return new RolePermission({
      roleId: this.roleId,
      permissionId: this.permissionId,
      role: this.role,
      permission: this.permission,
    })
  }
}
