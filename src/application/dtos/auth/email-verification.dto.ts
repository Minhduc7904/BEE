// src/application/dtos/auth/email-verification.dto.ts
import { IsString, IsNotEmpty } from 'class-validator'
import { BaseResponseDto } from '..'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class SendVerificationEmailRequestDto {
  userId: number // Lấy từ params
}

export class VerifyEmailRequestDto {
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Token') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Token') })
  token: string
}

export class SendVerificationEmailResponseDto extends BaseResponseDto {
  emailSent: string
  expiresAt: Date
}

export class VerifyEmailResponseDto extends BaseResponseDto {
  emailVerified: string
  verifiedAt: Date
}
