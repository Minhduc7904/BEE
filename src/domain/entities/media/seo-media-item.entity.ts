import { MediaEntity } from './media.entity'
import { SeoMediaSlotEntity } from './seo-media-slot.entity'

/**
 * SeoMediaItemEntity
 * Item mapping media vao 1 slot SEO.
 */
export class SeoMediaItemEntity {
  itemId: number
  slotId: number
  mediaId: number
  sortOrder: number
  alt: string | null
  linkUrl: string | null
  createdAt: Date
  updatedAt: Date
  slot?: SeoMediaSlotEntity
  media?: MediaEntity

  constructor(data: {
    itemId: number
    slotId: number
    mediaId: number
    sortOrder: number
    alt: string | null
    linkUrl: string | null
    createdAt: Date
    updatedAt: Date
    slot?: SeoMediaSlotEntity
    media?: MediaEntity
  }) {
    Object.assign(this, data)
  }
}

