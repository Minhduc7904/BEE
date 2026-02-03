import { MinLength } from 'class-validator'
import { IsRequiredEmail, IsOptionalString, IsRequiredString } from 'src/shared/decorators/validate'

/**
 * DTO for forgot password request
 */
export class ForgotPasswordDto {
  /**
   * User email to send reset password link
   * @required
   */
  @IsRequiredEmail('Email')
  email: string
}

/**
 * DTO for resetting password
 * 
 * Two modes:
 * 1. With token (from email link) - requires token and newPassword
 * 2. With old password - requires oldPassword and newPassword
 */
export class ResetPasswordDto {
  /**
   * Password reset token from email
   * @optional
   */
  @IsOptionalString('Token đặt lại mật khẩu')
  token?: string

  /**
   * Current password (for authenticated users)
   * @optional
   */
  @IsOptionalString('Mật khẩu hiện tại')
  oldPassword?: string

  /**
   * New password
   * @required
   * @minLength 6
   */
  @IsRequiredString('Mật khẩu mới', 6)
  newPassword: string
}

/**
 * DTO for sending reset password email
 */
export class SendResetPasswordEmailDto {
  /**
   * User email to send reset link
   * @required
   */
  @IsRequiredEmail('Email')
  email: string
}

/**
 * Response DTO after sending reset password email
 */
export class SendResetPasswordEmailResult {
  /**
   * Email address that reset link was sent to
   */
  emailSent: string

  /**
   * Token expiration timestamp
   */
  expiresAt: Date
}
