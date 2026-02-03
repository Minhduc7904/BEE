import { IsOptional, IsDateString, IsNotEmpty } from 'class-validator'
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
