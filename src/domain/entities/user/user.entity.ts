// src/domain/entities/user.entity.ts
import { Gender } from "../../../shared/enums"
import { MediaEntity } from "../media.entity"

export class User {
  userId: number
  oldUserId?: number
  username: string
  email?: string
  passwordHash: string
  firstName: string
  lastName: string

  // NEW: thuộc tính mới
  gender?: Gender
  dateOfBirth?: Date

  isActive: boolean
  avatarId?: number
  avatar?: MediaEntity
  isEmailVerified: boolean
  emailVerifiedAt?: Date
  lastLoginAt?: Date
  createdAt: Date
  updatedAt?: Date

  constructor(
    userId: number,
    username: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    isActive: boolean = true,
    avatarId?: number,
    avatar?: MediaEntity,
    email?: string,
    createdAt?: Date,
    isEmailVerified: boolean = false,
    emailVerifiedAt?: Date,
    lastLoginAt?: Date,
    updatedAt?: Date,
    oldUserId?: number,
    gender?: Gender,
    dateOfBirth?: Date,
  ) {
    this.userId = userId
    this.oldUserId = oldUserId
    this.username = username
    this.email = email
    this.passwordHash = passwordHash
    this.firstName = firstName
    this.lastName = lastName
    this.gender = gender
    this.dateOfBirth = dateOfBirth
    this.isActive = isActive
    this.avatarId = avatarId
    this.avatar = avatar
    this.isEmailVerified = isEmailVerified
    this.emailVerifiedAt = emailVerifiedAt
    this.lastLoginAt = lastLoginAt
    this.createdAt = createdAt || new Date()
    this.updatedAt = updatedAt
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  isEmailProvided(): boolean {
    return !!this.email
  }

  isEmailVerifiedStatus(): boolean {
    return this.isEmailVerified
  }

  needsEmailVerification(): boolean {
    return this.isEmailProvided() && !this.isEmailVerified
  }

  getAvatarUrl(): string | null {
    return this.avatar?.publicUrl || null
  }

  hasAvatar(): boolean {
    return !!this.avatarId && !!this.avatar
  }
}
