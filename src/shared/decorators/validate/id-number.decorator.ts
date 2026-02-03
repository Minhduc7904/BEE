import { applyDecorators } from '@nestjs/common'
import { IsInt, IsOptional, IsPositive, IsNotEmpty } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { ToNumber } from '../'

export function IsOptionalIdNumber(label: string) {
  return applyDecorators(
    ToNumber(),
    IsOptional(),
    IsInt({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsPositive({
      message: `${label} phải là số dương`,
    }),
  )
}

export function IsRequiredIdNumber(label: string) {
  return applyDecorators(
    ToNumber(),
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
