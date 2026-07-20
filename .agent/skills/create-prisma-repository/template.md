# Mẫu Prisma repository với relation options

Thay `Feature`, field và relation bằng schema thực tế. Chỉ thêm relation option khi có consumer cần nó.

```ts
// src/domain/interface/feature/feature-relation-options.ts
export interface FeatureRelationOptions {
  includeRelated?: boolean
}

// src/domain/repositories/feature.repository.ts
import { Feature } from '../entities/feature/feature.entity'
import { FeatureRelationOptions } from '../interface/feature/feature-relation-options'

export interface IFeatureRepository {
  findById(featureId: number, options?: FeatureRelationOptions): Promise<Feature | null>
}

// src/infrastructure/repositories/feature/prisma-feature.repository.ts
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { Feature } from '../../../domain/entities/feature/feature.entity'
import { FeatureRelationOptions } from '../../../domain/interface/feature/feature-relation-options'
import { IFeatureRepository } from '../../../domain/repositories/feature.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { FeatureMapper } from '../../mappers/feature/feature.mapper'

@Injectable()
export class PrismaFeatureRepository implements IFeatureRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  private buildInclude(options?: FeatureRelationOptions): Prisma.FeatureInclude | undefined {
    if (!options?.includeRelated) return undefined

    return { related: true }
  }

  async findById(featureId: number, options?: FeatureRelationOptions): Promise<Feature | null> {
    const record = await this.prisma.feature.findUnique({
      where: { featureId },
      include: this.buildInclude(options),
    })

    return record ? FeatureMapper.toDomainFeature(record, options) : null
  }
}
```

Trong `FeatureMapper`, chỉ gọi `RelatedMapper` khi `options?.includeRelated` là `true` **và** record thực sự có `related`. Dùng Prisma payload type cụ thể theo `create-prisma-mapper`; không thay bằng `any`.

Không thay `FeatureRelationOptions` bằng `includeRelations?: boolean` hoặc `Prisma.FeatureInclude` công khai. Không bật `includeRelated` mặc định.
