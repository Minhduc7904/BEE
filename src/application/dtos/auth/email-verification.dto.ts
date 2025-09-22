// src/application/dtos/auth/email-verification.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'
import { BaseResponseDto } from '..'
import { Trim } from '../../../shared/decorators'
import { SWAGGER_PROPERTIES, VALIDATION_MESSAGES } from '../../../shared/constants'

export class SendVerificationEmailRequestDto {
  @ApiProperty(SWAGGER_PROPERTIES.USER_ID)
  userId: number // Lấy từ params
}

export class VerifyEmailRequestDto {
  @ApiProperty(SWAGGER_PROPERTIES.EMAIL_VERIFICATION_TOKEN)
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Token') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Token') })
  token: string
}

export class SendVerificationEmailResponseDto extends BaseResponseDto {
  @ApiProperty(SWAGGER_PROPERTIES.EMAIL_SENT)
  emailSent: string

  @ApiProperty(SWAGGER_PROPERTIES.EXPIRES_AT)
  expiresAt: Date
}

export class VerifyEmailResponseDto extends BaseResponseDto {
  @ApiProperty(SWAGGER_PROPERTIES.EMAIL_VERIFIED)
  emailVerified: string

  @ApiProperty(SWAGGER_PROPERTIES.VERIFIED_AT)
  verifiedAt: Date
}
