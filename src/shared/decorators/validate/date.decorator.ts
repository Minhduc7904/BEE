import { IsOptional, IsDateString, IsNotEmpty, ValidateIf } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { EmptyToUndefined } from '../'

/**
 * Decorator for optional date field validation
 * @param label - Vietnamese label for error messages
 */
export function IsOptionalDate(label: string) {
  return applyDecorators(
    EmptyToUndefined(),
    IsOptional(),
    IsDateString({}, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

/**
 * Decorator cho trường ngày nullable (cho phép null để xóa giá trị).
 *
 * Khác với IsOptionalDate:
 * - IsOptionalDate: null/'' → undefined → field bị bỏ qua (không update)
 * - IsNullableDate: null → null → field được update thành null trong DB
 */
export function IsNullableDate(label: string) {
  return applyDecorators(
    EmptyToUndefined(),
    IsOptional(),
    ValidateIf((_object, value: unknown) => value !== null && value !== undefined),
    IsDateString({}, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}

/**
 * Decorator for required date field validation
 * @param label - Vietnamese label for error messages
 */
export function IsRequiredDate(label: string) {
  return applyDecorators(
    EmptyToUndefined(),
    IsNotEmpty({
      message: VALIDATION_MESSAGES.FIELD_REQUIRED(label),
    }),
    IsDateString({}, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label),
    }),
  )
}
