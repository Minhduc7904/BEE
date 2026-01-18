// src/domain/entities/role/role.entity.ts

import { RolePermission } from './role-permission.entity'

export class Role {
  // Required properties
  roleId: number
  roleName: string
  isAssignable: boolean
  createdAt: Date

  // Optional properties
  description?: string

  // Navigation properties
  rolePermissions?: RolePermission[]

  constructor(data: {
    roleId: number
    roleName: string
    isAssignable?: boolean
    createdAt?: Date
    description?: string
    rolePermissions?: RolePermission[]
  }) {
    this.roleId = data.roleId
    this.roleName = data.roleName
    this.isAssignable = data.isAssignable ?? true
    this.createdAt = data.createdAt || new Date()

    this.description = data.description
    this.rolePermissions = data.rolePermissions
  }

  /* ===================== DOMAIN METHODS ===================== */

  /**
   * Kiểm tra xem role này có thể được cấp cho user không
   */
  canBeAssigned(): boolean {
    return this.isAssignable === true
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
    return (
      this.rolePermissions?.some(
        (rp) => rp.permission?.code === permissionCode,
      ) ?? false
    )
  }

  /**
   * Lấy danh sách permission codes
   */
  getPermissionCodes(): string[] {
    return (
      this.rolePermissions
        ?.map((rp) => rp.permission?.code)
        .filter((code): code is string => Boolean(code)) ?? []
    )
  }

  /**
   * Kiểm tra role có permission system không
   */
  hasSystemPermission(): boolean {
    return (
      this.rolePermissions?.some(
        (rp) => rp.permission?.isSystem === true,
      ) ?? false
    )
  }

  equals(other: Role): boolean {
    return this.roleId === other.roleId
  }

  toJSON() {
    return {
      roleId: this.roleId,
      roleName: this.roleName,
      description: this.description,
      isAssignable: this.isAssignable,
      createdAt: this.createdAt,
    }
  }

  clone(): Role {
    return new Role({
      roleId: this.roleId,
      roleName: this.roleName,
      description: this.description,
      isAssignable: this.isAssignable,
      createdAt: this.createdAt,
      rolePermissions: this.rolePermissions,
    })
  }
}
