# Mẫu Prisma mapper

Điều chỉnh model, ID, field và relation theo schema/query thực tế. Chỉ dùng nhánh có relation khi repository đã tải relation đó.

```ts
import { Feature as PrismaFeature, Prisma } from '@prisma/client'
import { Feature } from '../../../domain/entities/feature/feature.entity'
import { FeatureStatus } from '../../../shared/enums'
import { RelatedMapper } from '../related/related.mapper'

type PrismaFeatureWithRelated = Prisma.FeatureGetPayload<{
  include: { related: true }
}>

export class FeatureMapper {
  static toDomainFeature(prisma: PrismaFeature | null): Feature | null {
    if (!prisma) return null

    return new Feature({
      featureId: prisma.featureId,
      name: prisma.name,
      // Chỉ cast sau khi đã xác minh FeatureStatus đồng bộ với Prisma enum tương ứng.
      status: prisma.status as FeatureStatus,
      createdAt: prisma.createdAt,
      description: prisma.description ?? undefined,
    })
  }

  static toDomainFeatureWithRelated(prisma: PrismaFeatureWithRelated | null): Feature | null {
    if (!prisma) return null

    return new Feature({
      featureId: prisma.featureId,
      name: prisma.name,
      status: prisma.status as FeatureStatus,
      createdAt: prisma.createdAt,
      description: prisma.description ?? undefined,
      related: RelatedMapper.toDomainRelated(prisma.related),
    })
  }

  static toDomainFeatures(prismaFeatures: PrismaFeature[]): Feature[] {
    return prismaFeatures
      .map((feature) => this.toDomainFeature(feature))
      .filter((feature): feature is Feature => feature !== null)
  }
}
```

Không thay `FeatureStatus` bằng `string`, number hoặc `any`. Không thay Prisma type bằng `any`; không truyền raw relation vào constructor domain; không thêm query hoặc `PrismaService`.
