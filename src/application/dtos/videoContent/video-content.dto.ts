// src/application/dtos/videoContent/video-content.dto.ts
import { VideoContent } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'

export class VideoContentResponseDto {
    videoContentId: number
    learningItemId: number
    content: string
    createdAt: Date
    updatedAt: Date

    static fromEntity(videoContent: VideoContent): VideoContentResponseDto {
        const dto = new VideoContentResponseDto()
        dto.videoContentId = videoContent.videoContentId
        dto.learningItemId = videoContent.learningItemId
        dto.content = videoContent.content
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
