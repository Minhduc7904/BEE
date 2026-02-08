import { IsEnumValue } from '../is-enum-value.decorator'
import { applyDecorators } from '@nestjs/common'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { IsOptional, IsNotEmpty } from 'class-validator'
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
