// src/application/dtos/base-response.dto.ts

export class BaseResponseDto<TData = any> {
    success: boolean

    message: string

  data?: TData

  constructor(success: boolean, message: string, data?: TData) {
    this.success = success
    this.message = message
    this.data = data
  }

  static success<T>(message: string, data?: T): BaseResponseDto<T> {
    return new BaseResponseDto(true, message, data)
  }

  static error<T>(message: string): BaseResponseDto<T> {
    return new BaseResponseDto(false, message, undefined) as BaseResponseDto<T>
  }
}
