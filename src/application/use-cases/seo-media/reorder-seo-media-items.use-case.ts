import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import {
  ReorderSeoMediaItemsDto,
  SeoMediaItemResponseDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class ReorderSeoMediaItemsUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(
    slotId: number,
    dto: ReorderSeoMediaItemsDto,
  ): Promise<BaseResponseDto<{ data: SeoMediaItemResponseDto[]; total: number }>> {
    const slot = await this.seoMediaSlotRepository.findById(slotId)
    if (!slot) {
      throw new NotFoundException(`SEO media slot with ID ${slotId} not found`)
    }

    const itemIds = dto.items.map((item) => item.itemId)
    const uniqueItemIds = new Set(itemIds)
    if (uniqueItemIds.size !== itemIds.length) {
      throw new BadRequestException('Duplicate itemId in reorder payload')
    }

    const currentItems = await this.seoMediaItemRepository.findBySlotId(slotId)
    const currentItemIdSet = new Set(currentItems.map((item) => item.itemId))

    for (const itemId of itemIds) {
      if (!currentItemIdSet.has(itemId)) {
        throw new BadRequestException(`Item ${itemId} does not belong to slot ${slotId}`)
      }
    }

    await Promise.all(
      dto.items.map((item) =>
        this.seoMediaItemRepository.update(item.itemId, {
          sortOrder: item.sortOrder,
        }),
      ),
    )

    const updatedItems = await this.seoMediaItemRepository.findBySlotId(slotId)

    return BaseResponseDto.success('SEO media items reordered successfully', {
      data: SeoMediaItemResponseDto.fromEntityList(updatedItems),
      total: updatedItems.length,
    })
  }
}
