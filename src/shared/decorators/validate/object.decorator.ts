import { applyDecorators } from '@nestjs/common'
import { IsNotEmpty, IsObject, IsOptional } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'

export function IsRequiredObject(label: string) {
  return applyDecorators(
    IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED(label) }),
    IsObject({ message: VALIDATION_MESSAGES.FIELD_INVALID(label) }),
  )
}

export function IsOptionalObject(label: string) {
  return applyDecorators(
    IsOptional(),
    IsObject({ message: VALIDATION_MESSAGES.FIELD_INVALID(label) }),
  )
}
