// src/infrastructure/mappers/learning-item.mapper.ts
import { LearningItem } from '../../domain/entities'
import { AdminMapper } from './admin.mapper'
import { LearningItemType } from '../../shared/enums'

/**
 * Mapper class để convert từ Prisma LearningItem models sang Domain LearningItem entities
 */
export class LearningItemMapper {
    /**
     * Convert Prisma LearningItem model sang Domain LearningItem entity
     */
    static toDomainLearningItem(prismaLearningItem: any): LearningItem | undefined {
        if (!prismaLearningItem) return undefined

        return new LearningItem({
            learningItemId: prismaLearningItem.learningItemId,
            type: prismaLearningItem.type as LearningItemType,
            title: prismaLearningItem.title,
            createdBy: prismaLearningItem.createdBy,
            createdAt: prismaLearningItem.createdAt,
            updatedAt: prismaLearningItem.updatedAt,
            description: prismaLearningItem.description ?? undefined,
            competitionId: prismaLearningItem.competitionId ?? undefined,
            competition: undefined, // Can be populated separately if needed
            admin: prismaLearningItem.admin ? AdminMapper.toDomainAdmin(prismaLearningItem.admin) : undefined,
            lessons: undefined, // Can be populated separately if needed
        })
    }

    /**
     * Convert array của Prisma LearningItems sang array của Domain LearningItems
     */
    static toDomainLearningItems(prismaLearningItems: any[]): LearningItem[] {
        return prismaLearningItems
            .map((item) => this.toDomainLearningItem(item))
            .filter(Boolean) as LearningItem[]
    }
}
