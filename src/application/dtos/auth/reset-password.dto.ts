import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from "class-validator";
import { SWAGGER_PROPERTIES } from "src/shared/constants";
import {Trim} from "../../../shared/decorators"
export class ForgotPasswordDto {
    @ApiProperty(SWAGGER_PROPERTIES.EMAIL)
    email: string
}

export class ResetPasswordDto {
  @ApiPropertyOptional({ description: 'Token reset password từ email' })
  @IsOptional()
  token?: string

  @ApiPropertyOptional({ description: 'Mật khẩu cũ (dùng khi đổi trực tiếp)' })
  @IsOptional()
  oldPassword?: string

  @ApiProperty({ description: 'Mật khẩu mới' })
  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string
}

export class SendResetPasswordEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @Trim()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string
}

export class SendResetPasswordEmailResult {
    emailSent: string
    expiresAt: Date
}


