// src/domain/entities/role/permission.entity.ts

import { RolePermission } from './role-permission.entity'

export class Permission {
  permissionId: number
  code: string
  name: string
  description?: string
  group?: string
  isSystem: boolean
  createdAt: Date

  // Navigation properties
  rolePermissions?: RolePermission[]

  constructor(
    permissionId: number,
    code: string,
    name: string,
    description?: string,
    group?: string,
    isSystem: boolean = false,
    createdAt?: Date,
    rolePermissions?: RolePermission[],
  ) {
    this.permissionId = permissionId
    this.code = code
    this.name = name
    this.description = description
    this.group = group
    this.isSystem = isSystem
    this.createdAt = createdAt || new Date()
    this.rolePermissions = rolePermissions
  }

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
}
