// src/application/dtos/user/user.dto.ts
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { User } from '../../../domain/entities'
import { Gender } from '../../../shared/enums'
import { IsOptionalString, IsOptionalEmail, IsOptionalEnumValue, IsOptionalDate, IsOptionalBoolean } from 'src/shared/decorators/validate'

export class UserResponseDto {
  userId: number

  username: string

  email?: string

  firstName: string

  lastName: string

  fullName: string

  // NEW: Giới tính
  gender?: Gender

  // NEW: Ngày sinh
  dateOfBirth?: Date

  isActive: boolean

  isEmailVerified: boolean

  avatarUrl?: string

  emailVerifiedAt?: Date

  lastLoginAt?: Date

  createdAt: Date

  updatedAt: Date

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial)
    this.fullName = `${this.lastName} ${this.firstName} `.trim()
  }

  /**
   * Factory method tạo từ User entity
   */
  static fromUser(user: User): UserResponseDto {
    // Map avatar if exists

    return new UserResponseDto({
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  }
}

/**
 * DTO cập nhật thông tin người dùng
 * @description Chứa các trường có thể cập nhật của người dùng
 */
export class UpdateUserDto {
  /**
   * Tên đăng nhập (3-50 ký tự)
   * @optional
   * @example "user123"
   */
  @IsOptionalString('Username', 50, 3)
  username?: string

  /**
   * Địa chỉ email (tối đa 120 ký tự)
   * @optional
   * @example "user@example.com"
   */
  @IsOptionalEmail('Email', 120)
  email?: string

  /**
   * Họ (tối đa 100 ký tự)
   * @optional
   * @example "Nguyễn"
   */
  @IsOptionalString('Họ', 100)
  lastName?: string

  /**
   * Tên (tối đa 50 ký tự)
   * @optional
   * @example "Văn A"
   */
  @IsOptionalString('Tên', 50)
  firstName?: string

  /**
   * Giới tính
   * @optional
   * @example "MALE"
   */
  @IsOptionalEnumValue(Gender, 'Giới tính')
  gender?: Gender

  /**
   * Ngày sinh
   * @optional
   * @example "2000-01-01"
   */
  @IsOptionalDate('Ngày sinh')
  dateOfBirth?: Date

  /**
   * Trạng thái xác thực email
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Trạng thái xác thực email')
  isEmailVerified?: boolean

  /**
   * Mật khẩu mới (chỉ admin mới được phép đặt trực tiếp)
   * @optional
   * @example "NewPassword123"
   */
  @IsOptionalString('Mật khẩu', 100, 6)
  password?: string
}
