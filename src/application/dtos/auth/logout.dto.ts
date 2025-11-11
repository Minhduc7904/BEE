// src/application/dtos/auth/logout.dto.ts
import { IsString, IsNotEmpty } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class LogoutRequestDto {
    @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Refresh token') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Refresh token') })
  refreshToken: string
}

export class LogoutResponseDto {
    message: string
}
