import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator'
import { Trim } from '../../../shared/decorators'
export class ForgotPasswordDto {
  email: string
}

export class ResetPasswordDto {
  @IsOptional()
  token?: string

  @IsOptional()
  oldPassword?: string

  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string
}

export class SendResetPasswordEmailDto {
  @Trim()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string
}

export class SendResetPasswordEmailResult {
  emailSent: string
  expiresAt: Date
}
