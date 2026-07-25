import { IsOptional, IsNotEmpty, IsInt, Min, Max, IsNumber, ValidateIf } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { ToNumber } from '../'
import { Transform } from 'class-transformer'
import { VALIDATION_MESSAGES } from 'src/shared/constants'

export function IsOptionalInt(label: string, min?: number, max?: number) {
  return applyDecorators(
    IsOptional(),
    ToNumber(),
    IsInt({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    min !== undefined
      ? Min(min, {
          message: VALIDATION_MESSAGES.FIELD_MIN_VALUE(label, min),
        })
      : (target: any, propertyKey: string) => {},
    max !== undefined
      ? Max(max, {
          message: VALIDATION_MESSAGES.FIELD_MAX_VALUE(label, max),
        })
      : (target: any, propertyKey: string) => {},
  )
}

export function IsRequiredInt(label: string, min?: number, max?: number) {
  return applyDecorators(
    ToNumber(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsInt({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    min !== undefined
      ? Min(min, {
          message: VALIDATION_MESSAGES.FIELD_MIN_VALUE(label, min),
        })
      : (target: any, propertyKey: string) => {},
    max !== undefined
      ? Max(max, {
          message: VALIDATION_MESSAGES.FIELD_MAX_VALUE(label, max),
        })
      : (target: any, propertyKey: string) => {},
  )
}

export function IsRequiredNumber(label: string, min?: number, max?: number) {
  return applyDecorators(
    ToNumber(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsNumber(
      {},
      {
        message: VALIDATION_MESSAGES.FIELD_INVALID(label),
      },
    ),
    min !== undefined
      ? Min(min, {
          message: VALIDATION_MESSAGES.FIELD_MIN_VALUE(label, min),
        })
      : (target: any, propertyKey: string) => {},
    max !== undefined
      ? Max(max, {
          message: VALIDATION_MESSAGES.FIELD_MAX_VALUE(label, max),
        })
      : (target: any, propertyKey: string) => {},
  )
}

export function IsOptionalNumber(label: string, min?: number, max?: number) {
  return applyDecorators(
    IsOptional(),
    ToNumber(),
    IsNumber(
      {},
      {
        message: VALIDATION_MESSAGES.FIELD_INVALID(label),
      },
    ),
    min !== undefined
      ? Min(min, {
          message: VALIDATION_MESSAGES.FIELD_MIN_VALUE(label, min),
        })
      : (target: any, propertyKey: string) => {},
    max !== undefined
      ? Max(max, {
          message: VALIDATION_MESSAGES.FIELD_MAX_VALUE(label, max),
        })
      : (target: any, propertyKey: string) => {},
  )
}

/**
 * Decorator cho trường số nguyên nullable (cho phép null để xóa giá trị).
 *
 * Khác với IsOptionalInt:
 * - IsOptionalInt: null → undefined → field bị bỏ qua (không update)
 * - IsNullableInt: null → null → field được update thành null trong DB
 *
 * Dùng cho các trường như durationMinutes, maxAttempts khi null mang ý nghĩa
 * "không giới hạn" hoặc "xóa giá trị đã đặt".
 */
export function IsNullableInt(label: string, min?: number, max?: number) {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => {
      if (value === null) return null
      if (value === '' || value === undefined) return undefined
      const parsed = Number(value)
      return isNaN(parsed) ? undefined : parsed
    }),
    ValidateIf((_obj, value) => value !== null && value !== undefined),
    IsInt({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    min !== undefined
      ? Min(min, {
          message: VALIDATION_MESSAGES.FIELD_MIN_VALUE(label, min),
        })
      : (target: any, propertyKey: string) => {},
    max !== undefined
      ? Max(max, {
          message: VALIDATION_MESSAGES.FIELD_MAX_VALUE(label, max),
        })
      : (target: any, propertyKey: string) => {},
  )
}
