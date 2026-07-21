import { applyDecorators } from '@nestjs/common'
import { ValidateIf } from 'class-validator'

import { IsRequiredIdNumber } from './id-number.decorator'

/** Yêu cầu ID số nguyên dương, nhưng cho phép null để biểu thị bỏ liên kết. */
export function IsRequiredNullableIdNumber(label: string) {
  return applyDecorators(
    ValidateIf((_object, value: unknown) => value !== null),
    IsRequiredIdNumber(label),
  )
}
