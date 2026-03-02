// src/application/dtos/profile/change-password.dto.ts
import { IsRequiredString } from '../../../shared/decorators/validate'

export class ChangePasswordDto {
  @IsRequiredString('Mật khẩu cũ', 100, 6)
  oldPassword: string

  @IsRequiredString('Mật khẩu mới', 100, 6)
  newPassword: string
}
