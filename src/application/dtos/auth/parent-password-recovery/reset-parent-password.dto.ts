import { IsRequiredString } from '../../../../shared/decorators/validate'

export class ResetParentPasswordDto {
  @IsRequiredString('Token đặt lại mật khẩu', 128, 1)
  token: string

  @IsRequiredString('Mật khẩu mới', 100, 6)
  newPassword: string

  @IsRequiredString('Xác nhận mật khẩu', 100, 6)
  confirmPassword: string
}

export class ResetParentPasswordResultDto {
  changed: boolean
}
