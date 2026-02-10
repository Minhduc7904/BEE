// src/application/dtos/documentContent/document-content.dto.ts
import { DocumentContent } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'
import { MediaType } from 'src/shared/enums'

export interface MediaFileDto {
    mediaId: number
    filename: string
    type: MediaType
    viewUrl?: string
}

export class DocumentContentResponseDto {
    documentContentId: number
    learningItemId: number
    content: string
    orderInDocument?: number
    mediaFiles?: MediaFileDto[]
    createdAt: Date
    updatedAt: Date

    static fromEntity(documentContent: DocumentContent, mediaFiles?: MediaFileDto[]): DocumentContentResponseDto {
        const dto = new DocumentContentResponseDto()
        dto.documentContentId = documentContent.documentContentId
        dto.learningItemId = documentContent.learningItemId
        dto.content = documentContent.content
        dto.orderInDocument = documentContent.orderInDocument ?? undefined
        dto.mediaFiles = mediaFiles
        dto.createdAt = documentContent.createdAt
        dto.updatedAt = documentContent.updatedAt
        return dto
    }
}

export class DocumentContentListResponseDto extends BaseResponseDto<{
    documentContents: DocumentContentResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
