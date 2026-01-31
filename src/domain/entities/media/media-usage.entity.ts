import { MediaVisibility } from 'src/shared/enums'
import { MediaEntity } from './media.entity'
/**
 * MediaUsageEntity - Domain entity for media attachment tracking
 * 
 * Source of truth for how media files are attached to entities.
 * Tracks entity type, entity ID, field name, and visibility settings.
 * 
 * Examples:
 * - User avatar: entityType="USER", entityId=userId, fieldName="avatar"
 * - Course thumbnail: entityType="COURSE", entityId=courseId, fieldName="thumbnail"
 * - Question image: entityType="QUESTION", entityId=questionId, fieldName="content_image"
 */
export class MediaUsageEntity {
  usageId: number
  mediaId: number
  entityType: string
  entityId: number
  fieldName: string | null
  usedBy: number | null
  visibility: MediaVisibility
  createdAt: Date
  media: MediaEntity  | null

  constructor(data: {
    usageId: number
    mediaId: number
    entityType: string
    entityId: number
    fieldName: string | null
    usedBy: number | null
    visibility: MediaVisibility
    createdAt: Date
    media?: MediaEntity | null
  }) {
    Object.assign(this, data)
  }

  isPublic(): boolean {
    return this.visibility === MediaVisibility.PUBLIC
  }

  isPrivate(): boolean {
    return this.visibility === MediaVisibility.PRIVATE
  }

  isProtected(): boolean {
    return this.visibility === MediaVisibility.PROTECTED
  }
}
