// src/infrastructure/mappers/competition.mapper.ts
import { Competition } from '../../../domain/entities'
// import { ExamMapper } from './exam.mapper'
import { AdminMapper } from '../user/admin.mapper'
import { HomeworkContentMapper } from '../learning-item/homework-content.mapper'

/**
 * Mapper class để convert từ Prisma Competition model
 * sang Domain Competition entity
 */
export class CompetitionMapper {
    /**
     * Convert Prisma Competition model sang Domain Competition entity
     */
    static toDomainCompetition(prismaCompetition: any): Competition | undefined {
        if (!prismaCompetition) return undefined

        return new Competition({
            competitionId: prismaCompetition.competitionId,
            examId: prismaCompetition.examId ?? undefined,
            title: prismaCompetition.title,
            subtitle: prismaCompetition.subtitle ?? undefined,
            startDate: prismaCompetition.startDate,
            endDate: prismaCompetition.endDate,
            policies: prismaCompetition.policies ?? undefined,
            createdBy: prismaCompetition.createdBy,
            visibility: prismaCompetition.visibility,

            durationMinutes: prismaCompetition.durationMinutes ?? undefined,
            maxAttempts: prismaCompetition.maxAttempts ?? undefined,
            showResultDetail: prismaCompetition.showResultDetail,
            allowLeaderboard: prismaCompetition.allowLeaderboard,
            allowViewScore: prismaCompetition.allowViewScore,
            allowViewAnswer: prismaCompetition.allowViewAnswer,
            enableAntiCheating: prismaCompetition.enableAntiCheating,

            createdAt: prismaCompetition.createdAt,
            updatedAt: prismaCompetition.updatedAt,

            // Relations
            // exam: prismaCompetition.exam
            //     ? ExamMapper.toDomainExam(prismaCompetition.exam)
            //     : undefined,

            admin: prismaCompetition.admin
                ? AdminMapper.toDomainAdmin(prismaCompetition.admin)
                : undefined,

            homeworkContents: prismaCompetition.homeworkContents
                ? prismaCompetition.homeworkContents.map(
                    HomeworkContentMapper.toDomainHomeworkContent,
                )
                : undefined,
        })
    }

    /**
     * Convert array Prisma Competitions sang array Domain Competitions
     */
    static toDomainCompetitions(prismaCompetitions: any[]): Competition[] {
        return prismaCompetitions
            .map((item) => this.toDomainCompetition(item))
            .filter(Boolean) as Competition[]
    }
}
