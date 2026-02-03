import { AdminResponseDto, StudentResponseDto } from '..'
import { IsOptionalString, IsRequiredString, IsOptionalEmail } from 'src/shared/decorators/validate'
import { MinLength } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

/**
 * DTO for user login request
 * 
 * Required fields:
 * - Password (Mật khẩu)
 * 
 * Optional fields (at least one required):
 * - Username (Tên đăng nhập)
 * - Email
 * 
 * Optional metadata fields:
 * - User Agent
 * - IP Address  
 * - Device Fingerprint
 */
export class LoginRequestDto {
  // Login credentials (at least one required)
  /**
   * Username for login
   * @optional
   */
  @IsOptionalString('Tên đăng nhập')
  username?: string

  /**
   * Email for login
   * @optional
   */
  @IsOptionalEmail('Email')
  email?: string

  /**
   * User password
   * @required
   * @minLength 6
   */
  @IsRequiredString('Mật khẩu', 6)
  password: string

  // Session metadata
  /**
   * Browser user agent
   * @optional
   */
  @IsOptionalString('User Agent')
  userAgent?: string

  /**
   * Client IP address
   * @optional
   */
  @IsOptionalString('Địa chỉ IP')
  ipAddress?: string

  /**
   * Unique device identifier
   * @optional
   */
  @IsOptionalString('Dấu vân tay thiết bị')
  deviceFingerprint?: string
}

/**
 * DTO for authentication tokens
 */
export class TokensDto {
  /**
   * JWT access token
   */
  accessToken: string

  /**
   * JWT refresh token
   */
  refreshToken: string

  /**
   * Token expiration time in seconds
   */
  expiresIn: number
}

/**
 * Response DTO after successful login
 */
export class LoginResponseDto {
  /**
   * Authentication tokens
   */
  tokens: TokensDto

  /**
   * Authenticated user data
   */
  user: AdminResponseDto | StudentResponseDto
}
