import { IsOptional, IsEmail, IsNotEmpty, MaxLength } from 'class-validator'
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
