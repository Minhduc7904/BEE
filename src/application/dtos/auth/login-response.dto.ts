import { ApiProperty } from '@nestjs/swagger'
import { BaseResponseDto } from '../common/base-response.dto'
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants'
import { AdminResponseDto } from '../admin/admin.dto'
import { StudentResponseDto } from '../student/student.dto'

export class TokensDto {
  @ApiProperty(SWAGGER_PROPERTIES.ACCESS_TOKEN)
  accessToken: string

  @ApiProperty(SWAGGER_PROPERTIES.REFRESH_TOKEN)
  refreshToken: string

  @ApiProperty(SWAGGER_PROPERTIES.EXPIRES_IN)
  expiresIn: number
}

export class LoginDataDto {
  @ApiProperty({ type: TokensDto })
  tokens: TokensDto

  @ApiProperty()
  user: AdminResponseDto | StudentResponseDto
}

export class LoginResponseDto {
  @ApiProperty({ type: TokensDto })
  tokens: TokensDto

  @ApiProperty()
  user: AdminResponseDto | StudentResponseDto
}
