// src/application/dtos/homeworkContent/homework-content.dto.ts
import { HomeworkContent } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'

export class HomeworkContentResponseDto {
    homeworkContentId: number
    learningItemId: number
    content: string
    dueDate?: Date
    competitionId?: number
    allowLateSubmit: boolean
    createdAt: Date
    updatedAt: Date

    static fromEntity(homeworkContent: HomeworkContent): HomeworkContentResponseDto {
        const dto = new HomeworkContentResponseDto()
        dto.homeworkContentId = homeworkContent.homeworkContentId
        dto.learningItemId = homeworkContent.learningItemId
        dto.content = homeworkContent.content
        dto.dueDate = homeworkContent.dueDate ?? undefined
        dto.competitionId = homeworkContent.competitionId ?? undefined
        dto.allowLateSubmit = homeworkContent.allowLateSubmit
        dto.createdAt = homeworkContent.createdAt
        dto.updatedAt = homeworkContent.updatedAt
        return dto
    }
}

export class HomeworkContentListResponseDto extends BaseResponseDto<{
    homeworkContents: HomeworkContentResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
