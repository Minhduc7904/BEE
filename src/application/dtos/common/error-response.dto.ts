// src/application/dtos/error-response.dto.ts

export class ErrorResponseDto {
    success: boolean

    message: string

    statusCode: number

    timestamp: string

    path: string

    code?: string

  constructor(message: string, statusCode: number, path: string, code?: string) {
    this.success = false
    this.message = message
    this.statusCode = statusCode
    this.timestamp = new Date().toISOString()
    this.path = path
    this.code = code
  }
}
