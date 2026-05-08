import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  GetSeoMediaItemListDto,
  SeoMediaItemListResponseDto,
  SeoMediaItemResponseDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class GetPublicSeoMediaItemsBySlotCodeUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) { }

  async execute(
    code: string,
    query: GetSeoMediaItemListDto,
  ): Promise<SeoMediaItemListResponseDto> {
    const slot = await this.seoMediaSlotRepository.findByCode(code.trim())
    if (!slot || !slot.isActive) {
      throw new NotFoundException(`SEO media slot with code "${code}" not found`)
    }

    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      this.seoMediaItemRepository.findBySlotId(slot.slotId, {
        includeSlot: query.includeSlot,
        skip,
        take: limit,
      }),
      this.seoMediaItemRepository.count({ slotId: slot.slotId }),
    ])

    return new SeoMediaItemListResponseDto(
      SeoMediaItemResponseDto.fromEntityList(items),
      page,
      limit,
      total,
    )
  }
}
