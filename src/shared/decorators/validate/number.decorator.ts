import { IsOptional, IsNotEmpty, IsInt, Min, Max, IsNumber } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { ToNumber } from '../'
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
