// src/application/dtos/user/user.dto.ts
import { IsOptional, IsString, IsEmail, MaxLength, MinLength, IsBoolean, IsEnum, IsDateString } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { User } from '../../../domain/entities'
import { Gender } from '../../../shared/enums'

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

export class UpdateUserDto {
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Username') })
  @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN('Username', 3) })
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Username', 50) })
  username?: string

  @Trim()
  @IsOptional()
  @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
  @MaxLength(120, { message: VALIDATION_MESSAGES.FIELD_MAX('Email', 120) })
  email?: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
  @MaxLength(100, { message: VALIDATION_MESSAGES.FIELD_MAX('Họ', 100) })
  lastName?: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Tên', 50) })
  firstName?: string

  // NEW: gender
  @IsOptional()
  @IsEnum(Gender, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giới tính') })
  gender?: Gender

  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Ngày sinh') })
  dateOfBirth?: Date

  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái xác thực email') })
  isEmailVerified?: boolean
}
