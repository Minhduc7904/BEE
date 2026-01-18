// src/infrastructure/mappers/video-content.mapper.ts
import { VideoContent } from '../../../domain/entities'
import { LearningItemMapper } from './learning-item.mapper'

/**
 * Mapper class để convert từ Prisma VideoContent model
 * sang Domain VideoContent entity
 */
export class VideoContentMapper {
    /**
     * Convert Prisma VideoContent model sang Domain VideoContent entity
     */
    static toDomainVideoContent(prismaVideoContent: any): VideoContent | undefined {
        if (!prismaVideoContent) return undefined

        return new VideoContent({
            videoContentId: prismaVideoContent.videoContentId,
            learningItemId: prismaVideoContent.learningItemId,
            content: prismaVideoContent.content,
            createdAt: prismaVideoContent.createdAt,
            updatedAt: prismaVideoContent.updatedAt,

            // Relations
            learningItem: prismaVideoContent.learningItem
                ? LearningItemMapper.toDomainLearningItem(prismaVideoContent.learningItem)
                : undefined,
        })
    }

    /**
     * Convert array Prisma VideoContents sang array Domain VideoContents
     */
    static toDomainVideoContents(prismaVideoContents: any[]): VideoContent[] {
        return prismaVideoContents
            .map((item) => this.toDomainVideoContent(item))
            .filter(Boolean) as VideoContent[]
    }
}
