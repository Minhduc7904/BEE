// src/application/dtos/youtubeContent/youtube-content.dto.ts
import { YoutubeContent } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'

export class YoutubeContentResponseDto {
    youtubeContentId: number
    learningItemId: number
    content: string
    youtubeUrl: string
    createdAt: Date
    updatedAt: Date

    static fromEntity(youtubeContent: YoutubeContent): YoutubeContentResponseDto {
        const dto = new YoutubeContentResponseDto()
        dto.youtubeContentId = youtubeContent.youtubeContentId
        dto.learningItemId = youtubeContent.learningItemId
        dto.content = youtubeContent.content
        dto.youtubeUrl = youtubeContent.youtubeUrl
        dto.createdAt = youtubeContent.createdAt
        dto.updatedAt = youtubeContent.updatedAt
        return dto
    }
}

export class YoutubeContentListResponseDto extends BaseResponseDto<{
    youtubeContents: YoutubeContentResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
