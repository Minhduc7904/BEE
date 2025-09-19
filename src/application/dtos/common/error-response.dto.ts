// src/application/dtos/error-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants'

export class ErrorResponseDto {
  @ApiProperty({ ...SWAGGER_PROPERTIES.SUCCESS, example: false })
  success: boolean

  @ApiProperty({ ...SWAGGER_PROPERTIES.MESSAGE, example: 'Lỗi rồi' })
  message: string

  @ApiProperty(SWAGGER_PROPERTIES.STATUS_CODE)
  statusCode: number

  @ApiProperty(SWAGGER_PROPERTIES.TIMESTAMP)
  timestamp: string

  @ApiProperty(SWAGGER_PROPERTIES.PATH)
  path: string

  constructor(message: string, statusCode: number, path: string) {
    this.success = false
    this.message = message
    this.statusCode = statusCode
    this.timestamp = new Date().toISOString()
    this.path = path
  }
}
