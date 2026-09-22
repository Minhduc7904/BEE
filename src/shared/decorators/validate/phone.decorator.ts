import { IsOptional, Matches, IsNotEmpty, ValidateIf } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { VALIDATION_MESSAGES, PHONE_VN_REGEX } from 'src/shared/constants'
import { Trim, EmptyToUndefined } from '../'

const LOCAL_PHONE_VN_REGEX = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$/

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
 * Decorator cho số điện thoại Việt Nam nullable (cho phép null để xóa giá trị).
 *
 * Khác với IsOptionalPhoneVN:
 * - IsOptionalPhoneVN: null/'' → undefined → field bị bỏ qua (không update)
 * - IsNullablePhoneVN: null → null → field được update thành null trong DB
 */
export function IsNullablePhoneVN(label: string) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsOptional(),
    ValidateIf((_object, value: unknown) => value !== null && value !== undefined),
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

/** Chỉ chấp nhận số điện thoại Việt Nam nội địa 10 chữ số, bắt đầu bằng 0. */
export function IsRequiredLocalPhoneVN(label: string) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    Matches(LOCAL_PHONE_VN_REGEX, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}
