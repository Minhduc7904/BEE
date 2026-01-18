// src/application/dtos/documentContent/document-content.dto.ts
import { DocumentContent } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'

export class DocumentContentResponseDto {
    documentContentId: number
    learningItemId: number
    content: string
    orderInDocument?: number
    createdAt: Date
    updatedAt: Date

    static fromEntity(documentContent: DocumentContent): DocumentContentResponseDto {
        const dto = new DocumentContentResponseDto()
        dto.documentContentId = documentContent.documentContentId
        dto.learningItemId = documentContent.learningItemId
        dto.content = documentContent.content
        dto.orderInDocument = documentContent.orderInDocument ?? undefined
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
