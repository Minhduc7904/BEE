import { MediaVisibility } from 'src/shared/enums'
import { MediaUsageEntity } from '../../../domain/entities'
import { MediaResponseDto } from '../media/media-response.dto'
/**
 * MediaUsageResponseDto - Response DTO for MediaUsage
 */
export class MediaUsageResponseDto {
  usageId: number
  mediaId: number
  entityType: string
  entityId: number
  fieldName: string | null
  usedBy: number | null
  visibility: MediaVisibility
  createdAt: Date
  media?: MediaResponseDto | null

  static fromEntity(entity: MediaUsageEntity): MediaUsageResponseDto {
    const dto = new MediaUsageResponseDto()
    dto.usageId = entity.usageId
    dto.mediaId = entity.mediaId
    dto.entityType = entity.entityType
    dto.entityId = entity.entityId
    dto.fieldName = entity.fieldName
    dto.usedBy = entity.usedBy
    dto.visibility = entity.visibility
    dto.createdAt = entity.createdAt
    dto.media = entity.media
      ? MediaResponseDto.fromEntity(entity.media)
      : null
    return dto
  }
}
