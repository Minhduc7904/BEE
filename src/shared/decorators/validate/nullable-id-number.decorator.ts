import { applyDecorators } from '@nestjs/common'
import { Transform } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsPositive, ValidateIf } from 'class-validator'

import { VALIDATION_MESSAGES } from '../../constants'

/** Yêu cầu ID số nguyên dương, nhưng cho phép null để biểu thị bỏ liên kết. */
export function IsRequiredNullableIdNumber(label: string) {
  return applyDecorators(
    Transform(({ value }) => {
      if (value === null) return null
      if (value === '' || value === undefined) return undefined

      const parsedValue = Number(value)
      return Number.isNaN(parsedValue) ? undefined : parsedValue
    }),
    ValidateIf((_object, value: unknown) => value !== null),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsInt({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsPositive({
      message: `${label} phải là số dương`,
    }),
  )
}

/** Cho phép bỏ qua trường hoặc truyền null để gỡ liên kết. */
export function IsOptionalNullableIdNumber(label: string) {
  return applyDecorators(
    Transform(({ value }) => {
      if (value === null) return null
      if (value === '' || value === undefined) return undefined

      const parsedValue = Number(value)
      return Number.isNaN(parsedValue) ? undefined : parsedValue
    }),
    IsOptional(),
    ValidateIf((_object, value: unknown) => value !== null && value !== undefined),
    IsInt({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsPositive({
      message: `${label} phải là số dương`,
    }),
  )
}
