import { IsEnumValue } from '../is-enum-value.decorator'
import { applyDecorators } from '@nestjs/common'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { IsOptional, IsNotEmpty, ValidateIf } from 'class-validator'
import { EmptyToUndefined } from '../to-string.decorator'

export function IsOptionalEnumValue(enumType: object, label: string) {
  return applyDecorators(
    IsOptional(),
    EmptyToUndefined(),
    IsEnumValue(enumType, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

/**
 * Decorator cho trường enum nullable (cho phép null để xóa giá trị).
 *
 * Khác với IsOptionalEnumValue:
 * - IsOptionalEnumValue: null/'' → undefined → field bị bỏ qua (không update)
 * - IsNullableEnumValue: null → null → field được update thành null trong DB
 */
export function IsNullableEnumValue(enumType: object, label: string) {
  return applyDecorators(
    IsOptional(),
    EmptyToUndefined(),
    ValidateIf((_object, value: unknown) => value !== null && value !== undefined),
    IsEnumValue(enumType, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

export function IsRequiredEnumValue(enumType: object, label: string) {
  return applyDecorators(
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsEnumValue(enumType, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}
