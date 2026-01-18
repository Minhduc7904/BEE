// src/domain/entities/role/permission.entity.ts

import { RolePermission } from './role-permission.entity'

export class Permission {
  // Required properties
  permissionId: number
  code: string
  name: string
  isSystem: boolean
  createdAt: Date

  // Optional properties
  description?: string
  group?: string

  // Navigation properties
  rolePermissions?: RolePermission[]

  constructor(data: {
    permissionId: number
    code: string
    name: string
    isSystem: boolean
    createdAt?: Date
    description?: string
    group?: string
    rolePermissions?: RolePermission[]
  }) {
    this.permissionId = data.permissionId
    this.code = data.code
    this.name = data.name
    this.isSystem = data.isSystem
    this.createdAt = data.createdAt || new Date()

    this.description = data.description
    this.group = data.group
    this.rolePermissions = data.rolePermissions
  }

  /* ===================== BUSINESS METHODS ===================== */

  /**
   * Kiểm tra xem permission có phải là system permission không (không thể xóa)
   */
  isSystemPermission(): boolean {
    return this.isSystem
  }

  /**
   * Lấy tên nhóm permission để hiển thị
   */
  getGroupDisplay(): string {
    return this.group || 'Khác'
  }

  /**
   * Lấy mô tả đầy đủ của permission
   */
  getFullDescription(): string {
    if (this.description) {
      return `${this.name}: ${this.description}`
    }
    return this.name
  }

  /**
   * Kiểm tra permission có thuộc nhóm cụ thể không
   */
  belongsToGroup(groupName: string): boolean {
    return this.group === groupName
  }

  /**
   * Lấy identifier duy nhất cho permission
   */
  getIdentifier(): string {
    return this.code
  }

  equals(other: Permission): boolean {
    return this.permissionId === other.permissionId
  }

  toJSON() {
    return {
      permissionId: this.permissionId,
      code: this.code,
      name: this.name,
      description: this.description,
      group: this.group,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
    }
  }

  clone(): Permission {
    return new Permission({
      permissionId: this.permissionId,
      code: this.code,
      name: this.name,
      description: this.description,
      group: this.group,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
      rolePermissions: this.rolePermissions,
    })
  }
}
