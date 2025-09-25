// src/domain/repositories/user.repository.ts
import {
  User,
  Admin,
  Student
} from '../entities'
import { Gender } from '../../shared/enums'

export interface CreateUserData {
  username: string
  email?: string
  passwordHash: string
  firstName: string
  lastName: string
  oldUserId?: number
  isActive?: boolean
  avatarId?: number
  isEmailVerified?: boolean
  emailVerifiedAt?: Date
  lastLoginAt?: Date
  createdAt?: Date
  updatedAt?: Date
  gender?: Gender
  dateOfBirth?: Date
}

export interface UpdateUserData {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  isActive?: boolean
  avatarId?: number
  passwordHash?: string
  isEmailVerified?: boolean
  emailVerifiedAt?: Date
  lastLoginAt?: Date
  gender?: Gender
  dateOfBirth?: Date
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>
  findById(id: number): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByPasswordHash(passwordHash: string): Promise<User | null>
  findByOldUserId(oldUserId: number): Promise<User | null>
  findByUsernameWithDetails(username: string): Promise<{
    user: User
    admin?: Admin
    student?: Student
  } | null>
  findByEmailWithDetails(email: string): Promise<{
    user: User
    admin?: Admin
    student?: Student
  } | null>

  update(id: number, data: UpdateUserData): Promise<User>
  delete(id: number): Promise<boolean>
  existsByUsername(username: string): Promise<boolean>
  existsByEmail(email: string): Promise<boolean>
}
