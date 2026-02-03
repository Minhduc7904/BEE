// src/application/dtos/auth/google-auth.dto.ts
import { IsRequiredString, IsRequiredEmail, IsOptionalString } from 'src/shared/decorators/validate'
import { IsBoolean } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

/**
 * DTO for Google user profile data
 */
export class GoogleUserProfileDto {
  /**
   * Google account ID
   * @required
   */
  @IsRequiredString('Google ID')
  googleId: string

  /**
   * Google account email
   * @required
   */
  @IsRequiredEmail('Email')
  email: string

  /**
   * User first name
   * @required
   */
  @IsRequiredString('Tên')
  firstName: string

  /**
   * User last name
   * @required
   */
  @IsRequiredString('Họ')
  lastName: string

  /**
   * Google profile picture URL
   * @optional
   */
  @IsOptionalString('URL ảnh đại diện')
  picture?: string

  /**
   * Whether Google email is verified
   */
  @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái xác thực') })
  verified: boolean
}

/**
 * Response DTO after Google authentication
 */
export class GoogleAuthResponseDto {
  /**
   * Authentication result message
   */
  message: string

  /**
   * JWT access token
   */
  accessToken: string

  /**
   * JWT refresh token
   */
  refreshToken: string

  /**
   * Authenticated user information
   */
  user: {
    /**
     * User ID in database
     */
    userId: number
    /**
     * User email
     */
    email: string
    /**
     * User first name
     */
    firstName: string
    /**
     * User last name
     */
    lastName: string
    /**
     * Username
     */
    username: string
    /**
     * User type (admin or student)
     */
    userType: 'admin' | 'student'
  }
}
