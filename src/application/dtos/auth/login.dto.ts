import { IsString, IsNotEmpty, MinLength, IsOptional, IsEmail } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { AdminResponseDto, StudentResponseDto } from '..'

export class LoginRequestDto {
  @Trim()
  @IsOptional()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên đăng nhập') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên đăng nhập') })
  username?: string

  @Trim()
  @IsOptional()
  @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
  email?: string

  @Trim()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Mật khẩu') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mật khẩu') })
  @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
  password: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('User Agent') })
  userAgent?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('IP Address') })
  ipAddress?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Device Fingerprint') })
  deviceFingerprint?: string
}

export class TokensDto {
  accessToken: string

  refreshToken: string

  expiresIn: number
}

export class LoginResponseDto {
  tokens: TokensDto

  user: AdminResponseDto | StudentResponseDto
}
