import { IsString, IsNotEmpty, MinLength, IsOptional, IsEmail } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages'
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants'
import { Trim } from '../../../shared/decorators/trim.decorator'

export class LoginRequestDto {
  @ApiProperty(SWAGGER_PROPERTIES.USERNAME)
  @Trim()
  @IsOptional()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên đăng nhập') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên đăng nhập') })
  username?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.EMAIL)
  @Trim()
  @IsOptional()
  @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
  email?: string

  @ApiProperty(SWAGGER_PROPERTIES.PASSWORD)
  @Trim()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Mật khẩu') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mật khẩu') })
  @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
  password: string

  @ApiPropertyOptional({ 
    description: 'User agent của browser/device',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('User Agent') })
  userAgent?: string

  @ApiPropertyOptional({
    description: 'Địa chỉ IP của client',
    example: '192.168.1.1'
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('IP Address') })
  ipAddress?: string

  @ApiPropertyOptional({
    description: 'Device fingerprint dựa trên thông tin browser và hardware',
    example: 'fp_abc123def456'
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Device Fingerprint') })
  deviceFingerprint?: string
}
