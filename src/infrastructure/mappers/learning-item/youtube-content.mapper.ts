// src/infrastructure/mappers/youtube-content.mapper.ts
import { YoutubeContent } from '../../../domain/entities'
import { LearningItemMapper } from './learning-item.mapper'

/**
 * Mapper class để convert từ Prisma YoutubeContent model
 * sang Domain YoutubeContent entity
 */
export class YoutubeContentMapper {
    /**
     * Convert Prisma YoutubeContent model sang Domain YoutubeContent entity
     */
    static toDomainYoutubeContent(prismaYoutubeContent: any): YoutubeContent | undefined {
        if (!prismaYoutubeContent) return undefined

        return new YoutubeContent({
            youtubeContentId: prismaYoutubeContent.youtubeContentId,
            learningItemId: prismaYoutubeContent.learningItemId,
            content: prismaYoutubeContent.content,
            youtubeUrl: prismaYoutubeContent.youtubeUrl,
            createdAt: prismaYoutubeContent.createdAt,
            updatedAt: prismaYoutubeContent.updatedAt,

            // Relations
            learningItem: prismaYoutubeContent.learningItem
                ? LearningItemMapper.toDomainLearningItem(prismaYoutubeContent.learningItem)
                : undefined,
        })
    }

    /**
     * Convert array Prisma YoutubeContents sang array Domain YoutubeContents
     */
    static toDomainYoutubeContents(prismaYoutubeContents: any[]): YoutubeContent[] {
        return prismaYoutubeContents
            .map((item) => this.toDomainYoutubeContent(item))
            .filter(Boolean) as YoutubeContent[]
    }
}
