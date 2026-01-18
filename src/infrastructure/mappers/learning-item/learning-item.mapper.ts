// src/infrastructure/mappers/learning-item.mapper.ts
import { LearningItem } from '../../../domain/entities'
import { AdminMapper } from '../user/admin.mapper'
import { HomeworkContentMapper } from './homework-content.mapper'
import { DocumentContentMapper } from './document-content.mapper'
import { YoutubeContentMapper } from './youtube-content.mapper'
import { VideoContentMapper } from './video-content.mapper'

/**
 * Mapper class để convert từ Prisma LearningItem model
 * sang Domain LearningItem entity
 */
export class LearningItemMapper {
    /**
     * Convert Prisma LearningItem model sang Domain LearningItem entity
     */
    static toDomainLearningItem(prismaLearningItem: any): LearningItem | undefined {
        if (!prismaLearningItem) return undefined

        return new LearningItem({
            learningItemId: prismaLearningItem.learningItemId,
            type: prismaLearningItem.type,
            title: prismaLearningItem.title,
            description: prismaLearningItem.description ?? undefined,
            createdBy: prismaLearningItem.createdBy,
            createdAt: prismaLearningItem.createdAt,
            updatedAt: prismaLearningItem.updatedAt,

            // Relations
            admin: prismaLearningItem.admin
                ? AdminMapper.toDomainAdmin(prismaLearningItem.admin)
                : undefined,

            homeworkContents: prismaLearningItem.homeworkContents
                ? prismaLearningItem.homeworkContents.map(
                    HomeworkContentMapper.toDomainHomeworkContent,
                )
                : undefined,

            documentContents: prismaLearningItem.documentContents
                ? prismaLearningItem.documentContents.map(
                    DocumentContentMapper.toDomainDocumentContent,
                )
                : undefined,

            youtubeContents: prismaLearningItem.youtubeContents
                ? prismaLearningItem.youtubeContents.map(
                    YoutubeContentMapper.toDomainYoutubeContent,
                )
                : undefined,

            videoContents: prismaLearningItem.videoContents
                ? prismaLearningItem.videoContents.map(
                    VideoContentMapper.toDomainVideoContent,
                )
                : undefined,

            studentLearningItems: prismaLearningItem.studentLearningItems
                ? prismaLearningItem.studentLearningItems
                : undefined,
        })
    }

    /**
     * Convert array Prisma LearningItems sang array Domain LearningItems
     */
    static toDomainLearningItems(prismaLearningItems: any[]): LearningItem[] {
        return prismaLearningItems
            .map((item) => this.toDomainLearningItem(item))
            .filter(Boolean) as LearningItem[]
    }
}
