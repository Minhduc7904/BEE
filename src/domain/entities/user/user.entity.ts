// src/domain/entities/user.entity.ts

import { Gender } from '../../../shared/enums'
import { UserRole } from '../role/user-role.entity'

export class User {
  /* ===================== REQUIRED PROPERTIES ===================== */
  userId: number
  username: string
  passwordHash: string
  firstName: string
  lastName: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: Date

  /* ===================== OPTIONAL PROPERTIES ===================== */
  email?: string
  gender?: Gender
  dateOfBirth?: Date
  lastLoginAt?: Date
  emailVerifiedAt?: Date
  updatedAt?: Date

  /* ===================== NAVIGATION PROPERTIES ===================== */
  userRoles?: UserRole[]

  constructor(data: {
    userId: number
    username: string
    passwordHash: string
    firstName: string
    lastName: string
    isActive?: boolean
    isEmailVerified?: boolean
    createdAt?: Date

    email?: string
    gender?: Gender
    dateOfBirth?: Date
    lastLoginAt?: Date
    emailVerifiedAt?: Date
    updatedAt?: Date

    userRoles?: UserRole[]
  }) {
    this.userId = data.userId
    this.username = data.username
    this.passwordHash = data.passwordHash
    this.firstName = data.firstName
    this.lastName = data.lastName
    this.isActive = data.isActive ?? true
    this.isEmailVerified = data.isEmailVerified ?? false
    this.createdAt = data.createdAt || new Date()

    this.email = data.email
    this.gender = data.gender
    this.dateOfBirth = data.dateOfBirth
    this.lastLoginAt = data.lastLoginAt
    this.emailVerifiedAt = data.emailVerifiedAt
    this.updatedAt = data.updatedAt

    this.userRoles = data.userRoles
  }

  /* ===================== DOMAIN METHODS ===================== */

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim()
  }

  hasEmail(): boolean {
    return Boolean(this.email)
  }

  needsEmailVerification(): boolean {
    return this.hasEmail() && !this.isEmailVerified
  }

  verifyEmail(at: Date = new Date()): void {
    this.isEmailVerified = true
    this.emailVerifiedAt = at
    this.updatedAt = new Date()
  }

  markLogin(): void {
    this.lastLoginAt = new Date()
  }

  deactivate(): void {
    this.isActive = false
  }

  activate(): void {
    this.isActive = true
  }

  /* ===================== ROLE / RBAC HELPERS ===================== */

  hasRole(roleId: number): boolean {
    return (
      this.userRoles?.some(
        (ur) => ur.roleId === roleId && ur.isValidRole(),
      ) ?? false
    )
  }

  getActiveRoleIds(): number[] {
    return (
      this.userRoles
        ?.filter((ur) => ur.isValidRole())
        .map((ur) => ur.roleId) ?? []
    )
  }

  /* ===================== BASE METHODS ===================== */

  equals(other: User): boolean {
    return this.userId === other.userId
  }

  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.getFullName(),
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      isActive: this.isActive,
      isEmailVerified: this.isEmailVerified,
      emailVerifiedAt: this.emailVerifiedAt,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  clone(): User {
    return new User({
      userId: this.userId,
      username: this.username,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.isActive,
      isEmailVerified: this.isEmailVerified,
      createdAt: this.createdAt,

      email: this.email,
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      lastLoginAt: this.lastLoginAt,
      emailVerifiedAt: this.emailVerifiedAt,
      updatedAt: this.updatedAt,
      userRoles: this.userRoles,
    })
  }
}
