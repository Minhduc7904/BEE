import { applyDecorators } from '@nestjs/common'
import { IsBoolean, IsOptional, IsNotEmpty } from 'class-validator'
import { ToBoolean } from '../'
import { VALIDATION_MESSAGES } from 'src/shared/constants'

export function IsOptionalBoolean(label: string) {
  return applyDecorators(
    IsOptional(),
    ToBoolean(),
    IsBoolean({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

export function IsRequiredBoolean(label: string) {
  return applyDecorators(
    ToBoolean(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsBoolean({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}
