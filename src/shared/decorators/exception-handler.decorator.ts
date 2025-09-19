// src/shared/decorators/exception-handler.decorator.ts
import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Decorator để tự động handle exceptions trong controller methods
 */
export function HandleExceptions(errorMessage: string = 'Đã xảy ra lỗi không mong muốn') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        if (error instanceof HttpException) {
          throw error
        }

        throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    }

    return descriptor
  }
}
