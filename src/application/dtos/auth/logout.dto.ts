// src/application/dtos/auth/logout.dto.ts
import { IsRequiredString } from 'src/shared/decorators/validate'

/**
 * DTO for user logout request
 */
export class LogoutRequestDto {
  /**
   * Refresh token to invalidate
   * @required
   */
  @IsRequiredString('Refresh token')
  refreshToken: string
}

/**
 * Response DTO after successful logout
 */
export class LogoutResponseDto {
  /**
   * Logout confirmation message
   */
  message: string
}
