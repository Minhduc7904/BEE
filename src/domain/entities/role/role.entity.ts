// src/domain/entities/role/role.entity.ts

import { RolePermission } from './role-permission.entity'

export class Role {
  roleId: number
  roleName: string
  description?: string
  isAssignable: boolean
  createdAt: Date

  // Navigation properties
  rolePermissions?: RolePermission[]

  constructor(
    roleId: number,
    roleName: string,
    description?: string,
    isAssignable: boolean = true,
    createdAt?: Date,
    rolePermissions?: RolePermission[],
  ) {
    this.roleId = roleId
    this.roleName = roleName
    this.description = description
    this.isAssignable = isAssignable
    this.createdAt = createdAt || new Date()
    this.rolePermissions = rolePermissions
  }

  /**
   * Kiểm tra xem role này có thể được cấp cho user không
   */
  canBeAssigned(): boolean {
    return this.isAssignable
  }

  /**
   * Lấy tên role hiển thị
   */
  getDisplayName(): string {
    return this.roleName
  }

  /**
   * Kiểm tra xem role có permission cụ thể không
   */
  hasPermission(permissionCode: string): boolean {
    if (!this.rolePermissions || this.rolePermissions.length === 0) {
      return false
    }

    return this.rolePermissions.some(
      (rp) => rp.permission?.code === permissionCode,
    )
  }

  /**
   * Lấy danh sách permission codes
   */
  getPermissionCodes(): string[] {
    if (!this.rolePermissions) {
      return []
    }

    return this.rolePermissions
      .filter((rp) => rp.permission?.code)
      .map((rp) => rp.permission!.code)
  }
}
