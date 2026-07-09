import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import { SeoMediaSlotResponseDto } from 'src/application/dtos/seo-media'
import { SeoMediaSlotEntity } from 'src/domain/entities'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'
import { PAGE_SEO_MEDIA_SLOTS } from 'src/shared/constants/page-slots'

type SyncSeoMediaSlotStatus = 'created' | 'updated' | 'unchanged'

interface FlattenedPageSlot {
  sourceKey: string
  pageKey: string
  slotKey: string
  code: string
  name: string
  type: string
  description: string
  isActive: boolean
  minItems: number
  maxItems: number | null
  recommendedWidth: number | null
  recommendedHeight: number | null
  metadata: Record<string, unknown>
}

interface DuplicateSeoMediaSlotCode {
  code: string
  sourceKeys: string[]
}

interface SyncSeoMediaSlotResultItem extends FlattenedPageSlot {
  slotId: number
  status: SyncSeoMediaSlotStatus
  slot: SeoMediaSlotResponseDto
}

export interface SyncSeoMediaSlotsFromPageSlotsResponse {
  source: string
  totalFromSource: number
  totalUnique: number
  createdCount: number
  updatedCount: number
  unchangedCount: number
  duplicateCodes: DuplicateSeoMediaSlotCode[]
  slots: SyncSeoMediaSlotResultItem[]
}

@Injectable()
export class SyncSeoMediaSlotsFromPageSlotsUseCase {
  constructor(
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(): Promise<BaseResponseDto<SyncSeoMediaSlotsFromPageSlotsResponse>> {
    const flattened = this.flattenPageSlots()
    const duplicateCodes = this.findDuplicateCodes(flattened)
    const seeds = this.uniqueByCode(flattened)
    const slots: SyncSeoMediaSlotResultItem[] = []

    for (const seed of seeds) {
      const existing = await this.seoMediaSlotRepository.findByCode(seed.code)
      const slot = await this.seoMediaSlotRepository.upsertByCode(seed)

      slots.push({
        ...seed,
        slotId: slot.slotId,
        status: this.getSyncStatus(existing, seed),
        slot: SeoMediaSlotResponseDto.fromEntity(slot),
      })
    }

    return BaseResponseDto.success('Sync SEO media slots from page-slots successfully', {
      source: 'src/shared/constants/page-slots.ts',
      totalFromSource: flattened.length,
      totalUnique: seeds.length,
      createdCount: slots.filter((item) => item.status === 'created').length,
      updatedCount: slots.filter((item) => item.status === 'updated').length,
      unchangedCount: slots.filter((item) => item.status === 'unchanged').length,
      duplicateCodes,
      slots,
    })
  }

  private flattenPageSlots(): FlattenedPageSlot[] {
    return Object.entries(PAGE_SEO_MEDIA_SLOTS).flatMap(([pageKey, slots]) =>
      Object.entries(slots).map(([slotKey, code]) => {
        const type = this.inferSlotType(slotKey, String(code))

        return {
          sourceKey: `${pageKey}.${slotKey}`,
          pageKey,
          slotKey,
          code: String(code).trim(),
          name: `${this.humanize(pageKey)} - ${this.humanize(slotKey)}`,
          type,
          description: `SEO media slot for page "${pageKey}", position "${slotKey}".`,
          isActive: true,
          minItems: 0,
          maxItems: null,
          recommendedWidth: null,
          recommendedHeight: null,
          metadata: {
            source: 'page-slots.ts',
            sourceKey: `${pageKey}.${slotKey}`,
            pageKey,
            slotKey,
          },
        }
      }),
    )
  }

  private inferSlotType(slotKey: string, code: string): string {
    const value = `${slotKey}_${code}`.toLowerCase()

    if (value.includes('gallery')) return 'gallery'
    if (value.includes('carousel')) return 'carousel'
    if (value.includes('video')) return 'video'
    if (value.includes('banner')) return 'banner'

    return 'image'
  }

  private humanize(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  private uniqueByCode(items: FlattenedPageSlot[]): FlattenedPageSlot[] {
    return Array.from(new Map(items.map((item) => [item.code, item])).values())
  }

  private findDuplicateCodes(items: FlattenedPageSlot[]): DuplicateSeoMediaSlotCode[] {
    const sourceKeysByCode = new Map<string, string[]>()

    for (const item of items) {
      sourceKeysByCode.set(item.code, [...(sourceKeysByCode.get(item.code) || []), item.sourceKey])
    }

    return Array.from(sourceKeysByCode.entries())
      .filter(([, sourceKeys]) => sourceKeys.length > 1)
      .map(([code, sourceKeys]) => ({ code, sourceKeys }))
  }

  private getSyncStatus(
    existing: SeoMediaSlotEntity | null,
    seed: FlattenedPageSlot,
  ): SyncSeoMediaSlotStatus {
    if (!existing) {
      return 'created'
    }

    const isUnchanged =
      existing.name === seed.name &&
      (existing.pageKey ?? null) === seed.pageKey &&
      existing.type === seed.type &&
      (existing.description ?? null) === seed.description &&
      existing.isActive === seed.isActive &&
      existing.minItems === seed.minItems &&
      (existing.maxItems ?? null) === seed.maxItems &&
      (existing.recommendedWidth ?? null) === seed.recommendedWidth &&
      (existing.recommendedHeight ?? null) === seed.recommendedHeight &&
      JSON.stringify(existing.metadata ?? null) === JSON.stringify(seed.metadata)

    return isUnchanged ? 'unchanged' : 'updated'
  }
}
