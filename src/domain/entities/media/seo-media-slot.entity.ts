import { SeoMediaItemEntity } from './seo-media-item.entity'

/**
 * SeoMediaSlotEntity
 * 1 slot SEO co the chua nhieu media item.
 */
export class SeoMediaSlotEntity {
  slotId: number
  code: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  items?: SeoMediaItemEntity[]

  constructor(data: {
    slotId: number
    code: string
    name: string
    description: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    items?: SeoMediaItemEntity[]
  }) {
    Object.assign(this, data)
  }

  hasItems(): boolean {
    return (this.items?.length || 0) > 0
  }
}

