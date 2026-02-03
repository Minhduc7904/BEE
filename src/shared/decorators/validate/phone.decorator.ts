import { IsOptional, Matches, IsNotEmpty } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { VALIDATION_MESSAGES, PHONE_VN_REGEX } from 'src/shared/constants'
import { Trim, EmptyToUndefined } from '../'

/**
 * Decorator for optional Vietnamese phone number validation
 * @param label - Vietnamese label for error messages
 */
export function IsOptionalPhoneVN(label: string) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsOptional(),
    Matches(PHONE_VN_REGEX, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

/**
 * Decorator for required Vietnamese phone number validation
 * @param label - Vietnamese label for error messages
 */
export function IsRequiredPhoneVN(label: string) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    Matches(PHONE_VN_REGEX, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}
