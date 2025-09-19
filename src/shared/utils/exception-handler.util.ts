// src/shared/utils/exception-handler.util.ts
import { HttpException, HttpStatus } from '@nestjs/common'

export class ExceptionHandler {
  /**
   * Wrap use case execution với error handling
   */
  static async execute<T>(useCase: () => Promise<T>): Promise<T> {
    try {
      return await useCase()
    } catch (error) {
      // HttpException sẽ được NestJS handle tự động
      if (error instanceof HttpException) {
        throw error
      }

      // Log lỗi để debug (chỉ trong development)
      if (process.env.NODE_ENV !== 'production') {
        console.error('Exception Handler caught error:', error)
      }

      // Các lỗi khác chuyển thành Internal Server Error
      throw new HttpException(error?.message || 'Đã xảy ra lỗi không mong muốn', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Wrap use case execution với custom error message
   */
  static async executeWithMessage<T>(
    useCase: () => Promise<T>,
    errorMessage: string = 'Đã xảy ra lỗi không mong muốn',
  ): Promise<T> {
    try {
      return await useCase()
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
