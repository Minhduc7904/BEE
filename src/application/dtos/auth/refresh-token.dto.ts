// src/application/dtos/auth/refresh-token.dto.ts
import { IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Trim } from '../../../shared/decorators/trim.decorator'
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants'
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages'

export class RefreshTokenRequestDto {
  @ApiProperty(SWAGGER_PROPERTIES.REFRESH_TOKEN)
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Refresh token') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Refresh token') })
  refreshToken: string
}

export class RefreshTokenResponseDto {
  @ApiProperty(SWAGGER_PROPERTIES.ACCESS_TOKEN)
  accessToken: string

  @ApiProperty(SWAGGER_PROPERTIES.REFRESH_TOKEN)
  refreshToken: string

  @ApiProperty(SWAGGER_PROPERTIES.EXPIRES_IN)
  expiresIn: number
}
