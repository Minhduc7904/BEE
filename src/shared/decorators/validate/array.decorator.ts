import { IsOptional, IsArray, IsNotEmpty, IsInt, IsPositive, IsString } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
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


