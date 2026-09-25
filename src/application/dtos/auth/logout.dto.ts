// src/application/dtos/auth/logout.dto.ts
import { IsOptionalString, IsRequiredString } from 'src/shared/decorators/validate'

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

  /**
   * Mã cài đặt ứng dụng của thiết bị đăng xuất; thiết bị này bị gỡ khỏi danh sách nhận thông báo đẩy.
   * Không truyền thì mọi thiết bị của tài khoản bị gỡ (hệ thống chỉ cho một phiên đăng nhập).
   */
  @IsOptionalString('Mã thiết bị', 128)
  deviceId?: string
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
