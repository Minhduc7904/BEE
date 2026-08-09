import { IsOptional, IsArray, IsNotEmpty, IsInt, IsPositive, IsString } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { Transform } from 'class-transformer'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { ToNumberArray, ToStringArray } from '../'

/**
 * Decorator for optional array field validation
 * @param label - Vietnamese label for error messages
 */
export function IsOptionalNumberArray(label: string) {
  return applyDecorators(
    ToNumberArray(),
    IsOptional(),
    IsArray({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsInt({
      each: true,
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

export function IsRequiredNumberArray(label: string) {
  return applyDecorators(
    ToNumberArray(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsArray({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsInt({
      each: true,
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

export function IsOptionalIntArray(label: string) {
  return applyDecorators(
    ToNumberArray(),
    IsOptional(),
    IsArray({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsInt({
      each: true,
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsPositive({
      each: true,
      message: `${label} phải là số nguyên dương`,
    }),
  )
}

/** Optional positive integer array that preserves [] so callers can clear a collection. */
export function IsOptionalIntArrayIncludingEmpty(label: string) {
  return applyDecorators(
    Transform(({ value }) => {
      if (value === '' || value === null || value === undefined) {
        return undefined
      }

      const values = Array.isArray(value) ? value : [value]
      return values.map((item) => {
        const parsed = Number(item)
        return Number.isNaN(parsed) ? undefined : parsed
      })
    }),
    IsOptional(),
    IsArray({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsInt({
      each: true,
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsPositive({
      each: true,
      message: `${label} pháº£i lÃ  sá»‘ nguyÃªn dÆ°Æ¡ng`,
    }),
  )
}

export function IsRequiredIntArray(label: string) {
  return applyDecorators(
    ToNumberArray(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsArray({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsInt({
      each: true,
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsPositive({
      each: true,
      message: `${label} phải là số nguyên dương`,
    }),
  )
}

export function IsOptionalStringArray(label: string) {
  return applyDecorators(
    ToStringArray(),
    IsOptional(),
    IsArray({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
    IsString({
      each: true,
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}
