# Mẫu Domain Entity

Chỉ giữ field, relation, default và method đã được yêu cầu hoặc xác minh từ mô-đun gần nhất. Với status, type, visibility hoặc tập giá trị hữu hạn, bắt buộc import shared enum phù hợp từ `src/shared/enums`.

```ts
import { FeatureStatus } from '../../../shared/enums'
import { RelatedEntity } from '../related/related.entity'

export class Feature {
  featureId: number
  name: string
  status: FeatureStatus
  createdAt: Date

  description?: string
  related?: RelatedEntity

  constructor(data: {
    featureId: number
    name: string
    status: FeatureStatus
    createdAt: Date
    description?: string
    related?: RelatedEntity
  }) {
    this.featureId = data.featureId
    this.name = data.name
    this.status = data.status
    this.createdAt = data.createdAt
    this.description = data.description
    this.related = data.related
  }

  isActive(): boolean {
    return this.status === FeatureStatus.ACTIVE
  }

  equals(other: Feature): boolean {
    return this.featureId === other.featureId
  }
}
```

Không thay `FeatureStatus` bằng `string`, number hoặc literal union. Không thêm `fromPrisma`, `toPrisma`, `toJSON`, Prisma type, `any`, query hoặc HTTP logic vào mẫu đã điền.
