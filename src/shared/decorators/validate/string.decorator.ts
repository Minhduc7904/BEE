import { IsOptional, MinLength, ValidateIf } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { IsString, IsNotEmpty, MaxLength } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { Trim } from '../'
import { EmptyToUndefined } from '../'

export function IsOptionalString(label: string, maxLength?: number, minLength?: number) {
  const decorators = [
    Trim(),
    EmptyToUndefined(),
    IsOptional(),
    IsString({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  ]

  if (maxLength) {
    decorators.push(
      MaxLength(maxLength, {
        message: VALIDATION_MESSAGES.FIELD_MAX_LENGTH(label, maxLength),
      }),
    )
  }

  if (minLength) {
    decorators.push(
      MinLength(minLength, {
        message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH(label, minLength),
      }),
    )
  }

  return applyDecorators(...decorators)
}


/**
 * Decorator cho trường chuỗi nullable (cho phép null để xóa giá trị).
 *
 * Khác với IsOptionalString:
 * - IsOptionalString: null/'' → undefined → field bị bỏ qua (không update)
 * - IsNullableString: null → null → field được update thành null trong DB
 */
export function IsNullableString(label: string, maxLength?: number, minLength?: number) {
  const decorators = [
    Trim(),
    EmptyToUndefined(),
    IsOptional(),
    ValidateIf((_object, value: unknown) => value !== null && value !== undefined),
    IsString({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  ]

  if (maxLength) {
    decorators.push(
      MaxLength(maxLength, {
        message: VALIDATION_MESSAGES.FIELD_MAX_LENGTH(label, maxLength),
      }),
    )
  }

  if (minLength) {
    decorators.push(
      MinLength(minLength, {
        message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH(label, minLength),
      }),
    )
  }

  return applyDecorators(...decorators)
}

export function IsRequiredString(label: string, maxLength?: number, minLength?: number) {
  const decorators = [
    Trim(),
    EmptyToUndefined(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsString({
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  ]

  if (maxLength) {
    decorators.push(
      MaxLength(maxLength, {
        message: VALIDATION_MESSAGES.FIELD_MAX_LENGTH(label, maxLength),
      }),
    )
  }

  if (minLength) {
    decorators.push(
      MinLength(minLength, {
        message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH(label, minLength),
      }),
    )
  }

  return applyDecorators(...decorators)
}
