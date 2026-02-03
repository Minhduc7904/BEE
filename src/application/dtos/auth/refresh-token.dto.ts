// src/application/dtos/auth/refresh-token.dto.ts
import { IsRequiredString } from 'src/shared/decorators/validate'

/**
 * DTO for refreshing access token
 */
export class RefreshTokenRequestDto {
  /**
   * Refresh token to generate new access token
   * @required
   */
  @IsRequiredString('Refresh token')
  refreshToken: string
}

/**
 * Response DTO after refreshing token
 */
export class RefreshTokenResponseDto {
  /**
   * New JWT access token
   */
  accessToken: string

  /**
   * New JWT refresh token
   */
  refreshToken: string

  /**
   * Token expiration time in seconds
   */
  expiresIn: number
}
