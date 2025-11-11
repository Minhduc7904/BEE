// src/application/dtos/auth/google-auth.dto.ts
import { IsEmail, IsOptional, IsString } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class GoogleUserProfileDto {
    @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Google ID') })
  googleId: string

    @Trim()
  @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
  email: string

    @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
  firstName: string

    @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
  lastName: string

    @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Avatar URL') })
  picture?: string

    verified: boolean
}

export class GoogleAuthResponseDto {
    message: string

    accessToken: string

    refreshToken: string

    user: {
    userId: number
    email: string
    firstName: string
    lastName: string
    username: string
    userType: 'admin' | 'student'
  }
}
