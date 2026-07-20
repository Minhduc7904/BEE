# Mẫu DTO cho BEE

Đọc toàn bộ `src/shared/decorators/validate` trước khi điền mẫu. Chỉ tạo decorator mới sau khi đọc skill `create-validate-decorator` và xác nhận không có decorator phù hợp.

```ts
import { FeatureStatus } from 'src/shared/enums'
import {
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalString,
  IsRequiredEnumValue,
  IsRequiredString,
} from 'src/shared/decorators/validate'
import { Feature } from '../../../domain/entities/feature/feature.entity'
import { ListQueryDto } from '../pagination/list-query.dto'

export class CreateFeatureDto {
  @IsRequiredString('Tên', 100, 2)
  name: string

  @IsRequiredEnumValue(FeatureStatus, 'Trạng thái')
  status: FeatureStatus

  @IsOptionalInt('Thứ tự', 0)
  order?: number
}

export class UpdateFeatureDto {
  @IsOptionalString('Tên', 100, 2)
  name?: string

  @IsOptionalEnumValue(FeatureStatus, 'Trạng thái')
  status?: FeatureStatus
}

export class FeatureListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(FeatureStatus, 'Trạng thái')
  status?: FeatureStatus

  toFeaturePaginationOptions() {
    const allowedSortFields = ['featureId', 'name', 'createdAt'] as const
    const sortBy = allowedSortFields.includes(this.sortBy as (typeof allowedSortFields)[number])
      ? this.sortBy
      : 'createdAt'

    return { page: this.page, limit: this.limit, sortBy, sortOrder: this.sortOrder }
  }
}

export class FeatureResponseDto {
  featureId: number
  name: string
  status: FeatureStatus

  static fromFeature(feature: Feature): FeatureResponseDto {
    return { featureId: feature.featureId, name: feature.name, status: feature.status }
  }

  static fromFeatureList(features: Feature[]): FeatureResponseDto[] {
    return features.map((feature) => this.fromFeature(feature))
  }
}
```

Không dùng chung create/update DTO nếu required field khác nhau. Không thêm ownership ID do client tự gửi trong endpoint self-service; không dùng raw class-validator khi đã có validation decorator tương ứng.
