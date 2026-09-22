import { IsOptional, IsEmail, IsNotEmpty, MaxLength, ValidateIf } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { Trim, EmptyToUndefined } from '../'

/**
 * Decorator for optional email field validation
 * @param label - Vietnamese label for error messages
 */
export function IsOptionalEmail(label: string, maxLength?: number) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsOptional(),
    maxLength !== undefined ? MaxLength(maxLength, {
        message: VALIDATION_MESSAGES.FIELD_MAX_LENGTH(label, maxLength),
        }) : (target: any, propertyKey: string) => {},
    IsEmail({}, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

/**
 * Decorator cho trường email nullable (cho phép null để xóa giá trị).
 *
 * Khác với IsOptionalEmail:
 * - IsOptionalEmail: null/'' → undefined → field bị bỏ qua (không update)
 * - IsNullableEmail: null → null → field được update thành null trong DB
 */
export function IsNullableEmail(label: string, maxLength?: number) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsOptional(),
    ValidateIf((_object, value: unknown) => value !== null && value !== undefined),
    maxLength !== undefined ? MaxLength(maxLength, {
        message: VALIDATION_MESSAGES.FIELD_MAX_LENGTH(label, maxLength),
        }) : (target: any, propertyKey: string) => {},
    IsEmail({}, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

/**
 * Decorator for required email field validation
 * @param label - Vietnamese label for error messages
 */
export function IsRequiredEmail(label: string, maxLength?: number) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    maxLength !== undefined ? MaxLength(maxLength, {
        message: VALIDATION_MESSAGES.FIELD_MAX_LENGTH(label, maxLength),
        }) : (target: any, propertyKey: string) => {},
    IsEmail({}, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}
