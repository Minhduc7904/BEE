// src/infrastructure/mappers/homework-content.mapper.ts
import { HomeworkContent } from '../../../domain/entities'
import { LearningItemMapper } from './learning-item.mapper'
import { CompetitionMapper } from '../competition/competition.mapper'
import { HomeworkSubmitMapper } from './homework-submit.mapper'

/**
 * Mapper class để convert từ Prisma HomeworkContent model
 * sang Domain HomeworkContent entity
 */
export class HomeworkContentMapper {
    /**
     * Convert Prisma HomeworkContent model sang Domain HomeworkContent entity
     */
    static toDomainHomeworkContent(prismaHomeworkContent: any): HomeworkContent | undefined {
        if (!prismaHomeworkContent) return undefined

        return new HomeworkContent({
            homeworkContentId: prismaHomeworkContent.homeworkContentId,
            learningItemId: prismaHomeworkContent.learningItemId,
            content: prismaHomeworkContent.content,
            dueDate: prismaHomeworkContent.dueDate ?? undefined,
            competitionId: prismaHomeworkContent.competitionId ?? undefined,
            allowLateSubmit: prismaHomeworkContent.allowLateSubmit,
            createdAt: prismaHomeworkContent.createdAt,
            updatedAt: prismaHomeworkContent.updatedAt,

            // Relations
            learningItem: prismaHomeworkContent.learningItem
                ? LearningItemMapper.toDomainLearningItem(prismaHomeworkContent.learningItem)
                : undefined,

            competition: prismaHomeworkContent.competition
                ? CompetitionMapper.toDomainCompetition(prismaHomeworkContent.competition)
                : undefined,

            homeworkSubmits: prismaHomeworkContent.homeworkSubmits
                ? prismaHomeworkContent.homeworkSubmits.map(
                    HomeworkSubmitMapper.toDomainHomeworkSubmit,
                )
                : undefined,
        })
    }

    /**
     * Convert array Prisma HomeworkContents sang array Domain HomeworkContents
     */
    static toDomainHomeworkContents(prismaHomeworkContents: any[]): HomeworkContent[] {
        return prismaHomeworkContents
            .map((item) => this.toDomainHomeworkContent(item))
            .filter(Boolean) as HomeworkContent[]
    }
}
