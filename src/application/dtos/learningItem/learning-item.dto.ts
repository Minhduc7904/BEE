// src/application/dtos/learningItem/learning-item.dto.ts
import { LearningItem } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'
import { LearningItemType } from '../../../shared/enums'
import { AdminResponseDto } from '../admin/admin.dto'

export class LearningItemResponseDto {
    learningItemId: number
    type: LearningItemType
    title: string
    description?: string
    createdBy: number
    createdAt: Date
    updatedAt: Date
    admin?: AdminResponseDto

    static fromEntity(learningItem: LearningItem): LearningItemResponseDto {
        const dto = new LearningItemResponseDto()
        dto.learningItemId = learningItem.learningItemId
        dto.type = learningItem.type
        dto.title = learningItem.title
        dto.description = learningItem.description ?? undefined
        dto.createdBy = learningItem.createdBy
        dto.createdAt = learningItem.createdAt
        dto.updatedAt = learningItem.updatedAt
        
        if (learningItem.admin) {
            dto.admin = AdminResponseDto.fromUserWithAdmin(
                learningItem.admin.user,
                learningItem.admin
            )
        }

        return dto
    }
}

export class LearningItemListResponseDto extends BaseResponseDto<{
    learningItems: LearningItemResponseDto[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> { }
