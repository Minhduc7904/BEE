// src/domain/entities/role.entity.ts

export class Role {
  roleId: number
  roleName: string
  description?: string
  isAssignable: boolean
  requiredByRoleId?: number
  createdAt: Date

  // Navigation properties
  requiredByRole?: Role
  childRoles?: Role[]

  constructor(
    roleId: number,
    roleName: string,
    description?: string,
    isAssignable: boolean = true,
    requiredByRoleId?: number,
    createdAt?: Date,
    requiredByRole?: Role,
    childRoles?: Role[],
  ) {
    this.roleId = roleId
    this.roleName = roleName
    this.description = description
    this.isAssignable = isAssignable
    this.requiredByRoleId = requiredByRoleId
    this.createdAt = createdAt || new Date()
    this.requiredByRole = requiredByRole
    this.childRoles = childRoles
  }

  /**
   * Kiểm tra xem role này có thể được cấp bởi role khác không
   */
  canBeAssignedBy(assignerRoleId: number): boolean {
    if (!this.isAssignable) {
      return false
    }

    // Nếu không yêu cầu role nào thì ai cũng có thể cấp
    if (!this.requiredByRoleId) {
      return true
    }

    return this.requiredByRoleId === assignerRoleId
  }

  /**
   * Kiểm tra xem role này có phải là role gốc không (không cần role nào để cấp)
   */
  isRootRole(): boolean {
    return !this.requiredByRoleId
  }

  /**
   * Lấy level của role trong hierarchy (0 = root, 1 = level 1, ...)
   */
  getHierarchyLevel(): number {
    if (this.isRootRole()) {
      return 0
    }

    if (this.requiredByRole) {
      return this.requiredByRole.getHierarchyLevel() + 1
    }

    return 1 // Default nếu không có thông tin parent
  }
}
