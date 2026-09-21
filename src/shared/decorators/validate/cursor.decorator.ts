import { IsOptional, Matches } from 'class-validator'
import { applyDecorators } from '@nestjs/common'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { Trim, EmptyToUndefined } from '../'

const RESULT_CURSOR_REGEX = /^\d+_\d+$/

/** Cursor phân trang dạng "{epochMillis}_{id}", dùng cho các API cuộn vô hạn. */
export function IsOptionalResultCursor(label: string) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsOptional(),
    Matches(RESULT_CURSOR_REGEX, {
      message: VALIDATION_MESSAGES.FIELD_INVALID(label, 'dạng "{epochMillis}_{id}"'),
    }),
  )
}
