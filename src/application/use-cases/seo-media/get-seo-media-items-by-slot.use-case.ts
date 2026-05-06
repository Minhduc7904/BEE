import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  GetSeoMediaItemListDto,
  SeoMediaItemListResponseDto,
  SeoMediaItemResponseDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class GetSeoMediaItemsBySlotUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(
    slotId: number,
    query: GetSeoMediaItemListDto,
  ): Promise<SeoMediaItemListResponseDto> {
    const slot = await this.seoMediaSlotRepository.findById(slotId)
    if (!slot) {
      throw new NotFoundException(`SEO media slot with ID ${slotId} not found`)
    }

    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      this.seoMediaItemRepository.findBySlotId(slotId, {
        includeSlot: query.includeSlot,
        skip,
        take: limit,
      }),
      this.seoMediaItemRepository.count({ slotId }),
    ])

    return new SeoMediaItemListResponseDto(
      SeoMediaItemResponseDto.fromEntityList(items),
      page,
      limit,
      total,
    )
  }
}
