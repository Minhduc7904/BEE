// src/application/dtos/auth/email-verification.dto.ts
import { BaseResponseDto } from '..'
import { IsRequiredString } from 'src/shared/decorators/validate'

/**
 * DTO for sending verification email request
 * User ID is retrieved from route params
 */
export class SendVerificationEmailRequestDto {
  /**
   * User ID to send verification email
   * Retrieved from route params
   */
  userId: number
}

/**
 * DTO for verifying email with token
 */
export class VerifyEmailRequestDto {
  /**
   * Email verification token
   * @required
   */
  @IsRequiredString('Token xác thực email')
  token: string
}

/**
 * Response DTO after sending verification email
 */
export class SendVerificationEmailResponseDto extends BaseResponseDto {
  /**
   * Email address that verification was sent to
   */
  emailSent: string

  /**
   * Token expiration timestamp
   */
  expiresAt: Date
}

/**
 * Response DTO after email verification
 */
export class VerifyEmailResponseDto extends BaseResponseDto {
  /**
   * Verified email address
   */
  emailVerified: string

  /**
   * Verification timestamp
   */
  verifiedAt: Date
}
