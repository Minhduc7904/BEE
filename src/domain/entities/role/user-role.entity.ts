// src/domain/entities/role/user-role.entity.ts

import { Role } from './role.entity'

export interface UserInfo {
  userId: number
  username: string
  firstName: string
  lastName: string
  email?: string
}

export class UserRole {
  // Composite key
  userId: number
  roleId: number

  // State properties
  assignedAt: Date
  isActive: boolean

  // Optional properties
  expiresAt?: Date
  assignedBy?: number

  // Navigation properties
  role?: Role
  user?: UserInfo
  assignedByUser?: UserInfo

  constructor(data: {
    userId: number
    roleId: number
    assignedAt?: Date
    expiresAt?: Date
    assignedBy?: number
    isActive?: boolean
    role?: Role
    user?: UserInfo
    assignedByUser?: UserInfo
  }) {
    this.userId = data.userId
    this.roleId = data.roleId
    this.assignedAt = data.assignedAt || new Date()
    this.expiresAt = data.expiresAt
    this.assignedBy = data.assignedBy
    this.isActive = data.isActive ?? true

    this.role = data.role
    this.user = data.user
    this.assignedByUser = data.assignedByUser
  }

  /* ===================== DOMAIN METHODS ===================== */

  /**
   * Role còn hiệu lực không
   */
  isValidRole(): boolean {
    if (!this.isActive) return false
    if (!this.expiresAt) return true // vĩnh viễn
    return new Date() < this.expiresAt
  }

  /**
   * Role sắp hết hạn (N ngày)
   */
  isExpiringSoon(daysThreshold: number = 7): boolean {
    if (!this.expiresAt) return false

    const now = new Date()
    const threshold = new Date(
      now.getTime() + daysThreshold * 24 * 60 * 60 * 1000,
    )

    return this.expiresAt <= threshold && this.expiresAt > now
  }

  /**
   * Role đã hết hạn chưa
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false
    return new Date() > this.expiresAt
  }

  /**
   * Số ngày còn lại
   */
  getDaysRemaining(): number | null {
    if (!this.expiresAt) return null

    const diff = this.expiresAt.getTime() - Date.now()
    if (diff <= 0) return 0

    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * Gia hạn role
   */
  extendRole(additionalDays: number): void {
    const base = this.expiresAt ?? new Date()
    this.expiresAt = new Date(
      base.getTime() + additionalDays * 24 * 60 * 60 * 1000,
    )
  }

  /**
   * Vô hiệu hóa role
   */
  deactivate(): void {
    this.isActive = false
  }

  /**
   * Kích hoạt role
   */
  activate(): void {
    this.isActive = true
  }

  /**
   * Key duy nhất cho cache / compare
   */
  getRoleKey(): string {
    return `user:${this.userId}:role:${this.roleId}`
  }

  equals(other: UserRole): boolean {
    return (
      this.userId === other.userId &&
      this.roleId === other.roleId
    )
  }

  toJSON() {
    return {
      userId: this.userId,
      roleId: this.roleId,
      assignedAt: this.assignedAt,
      expiresAt: this.expiresAt,
      assignedBy: this.assignedBy,
      isActive: this.isActive,
    }
  }

  clone(): UserRole {
    return new UserRole({
      userId: this.userId,
      roleId: this.roleId,
      assignedAt: this.assignedAt,
      expiresAt: this.expiresAt,
      assignedBy: this.assignedBy,
      isActive: this.isActive,
      role: this.role,
      user: this.user,
      assignedByUser: this.assignedByUser,
    })
  }
}
