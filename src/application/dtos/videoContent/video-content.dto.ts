// src/application/dtos/videoContent/video-content.dto.ts
import { VideoContent } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'
import { MediaType } from 'src/shared/enums'

export interface MediaFileDto {
    mediaId: number
    filename: string
    type: MediaType
    viewUrl?: string
}

export class VideoContentResponseDto {
    videoContentId: number
    learningItemId: number
    content: string
    mediaFiles?: MediaFileDto[]
    createdAt: Date
    updatedAt: Date

    static fromEntity(videoContent: VideoContent, mediaFiles?: MediaFileDto[]): VideoContentResponseDto {
        const dto = new VideoContentResponseDto()
        dto.videoContentId = videoContent.videoContentId
        dto.learningItemId = videoContent.learningItemId
        dto.content = videoContent.content
        dto.mediaFiles = mediaFiles
        dto.createdAt = videoContent.createdAt
        dto.updatedAt = videoContent.updatedAt
        return dto
    }
}

export class VideoContentListResponseDto extends BaseResponseDto<{
    videoContents: VideoContentResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
