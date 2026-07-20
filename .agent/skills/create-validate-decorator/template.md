# Mẫu validation decorator

Dùng mẫu này khi không có decorator hiện có phù hợp. Điều chỉnh kiểu validation/transform và message, nhưng không thêm database hoặc business logic.

```ts
import { applyDecorators } from '@nestjs/common'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { EmptyToUndefined, Trim } from '../'

export function IsOptionalSlug(label: string, maxLength = 120) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsOptional(),
    IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID(label) }),
    MaxLength(maxLength, {
      message: VALIDATION_MESSAGES.FIELD_MAX_LENGTH(label, maxLength),
    }),
  )
}

export function IsRequiredSlug(label: string, maxLength = 120) {
  return applyDecorators(
    Trim(),
    EmptyToUndefined(),
    IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED(label) }),
    IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID(label) }),
    MaxLength(maxLength, {
      message: VALIDATION_MESSAGES.FIELD_MAX_LENGTH(label, maxLength),
    }),
  )
}
```

Sau khi tạo, thêm `export * from './slug.decorator'` vào `src/shared/decorators/validate/index.ts`. Nếu một decorator enum đã tồn tại, dùng `IsRequiredEnumValue` hoặc `IsOptionalEnumValue` thay vì tạo lại.
