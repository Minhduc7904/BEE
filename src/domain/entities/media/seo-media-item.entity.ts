import { SeoMediaSlotEntity } from './seo-media-slot.entity'
import { MediaType } from 'src/shared/enums'

/**
 * SeoMediaItemEntity
 * Item mapping media vao 1 slot SEO.
 */
export class SeoMediaItemEntity {
  itemId: number
  slotId: number
  bucketName: string
  objectKey: string
  publicUrl: string
  originalName: string
  mimeType: string
  mediaType: MediaType
  fileSize: number
  width: number | null
  height: number | null
  duration: number | null
  sortOrder: number
  alt: string | null
  linkUrl: string | null
  createdAt: Date
  updatedAt: Date
  slot?: SeoMediaSlotEntity

  constructor(data: {
    itemId: number
    slotId: number
    bucketName: string
    objectKey: string
    publicUrl: string
    originalName: string
    mimeType: string
    mediaType: MediaType
    fileSize: number
    width: number | null
    height: number | null
    duration: number | null
    sortOrder: number
    alt: string | null
    linkUrl: string | null
    createdAt: Date
    updatedAt: Date
    slot?: SeoMediaSlotEntity
  }) {
    Object.assign(this, data)
  }
}
