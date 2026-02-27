// src/application/dtos/homeworkContent/homework-content.dto.ts
import { HomeworkContent } from '../../../domain/entities'
import { BaseResponseDto } from '../common/base-response.dto'
import { Visibility } from '../../../shared/enums'
import { HomeworkProgressDto } from '../learningItem/student-learning-item.dto'
import { LearningItemResponseDto } from '../learningItem/learning-item.dto'

/**
 * Competition basic info for homework
 */
export class CompetitionBasicDto {
    competitionId: number
    title: string
    subtitle?: string
    startDate?: Date | null
    endDate?: Date | null
    visibility: Visibility
    durationMinutes?: number
    maxAttempts?: number
    examId?: number
    allowViewScore: boolean
    allowLeaderboard: boolean
    allowViewSolutionYoutubeUrl: boolean
    allowViewExamContent: boolean
    exam?: {
        examId: number
        title: string
        grade?: number
        solutionYoutubeUrl?: string | null
    }
}

export class HomeworkContentResponseDto {
    homeworkContentId: number
    learningItemId: number
    content: string
    dueDate?: Date
    competitionId?: number
    competition?: CompetitionBasicDto
    allowLateSubmit: boolean
    updatePointsOnLateSubmit: boolean
    updatePointsOnReSubmit: boolean
    updateMaxPoints: boolean
    createdAt: Date
    updatedAt: Date
    
    // Submit của student cho homework content này (shortcut để dễ truy cập)
    homeworkSubmit?: import('../learningItem/student-learning-item.dto').HomeworkSubmitDto

    // Progress của student cho homework content này
    progress?: HomeworkProgressDto

    // Learning item details
    learningItem?: LearningItemResponseDto

    static fromEntity(homeworkContent: HomeworkContent, progress?: HomeworkProgressDto): HomeworkContentResponseDto {
        const dto = new HomeworkContentResponseDto()
        dto.homeworkContentId = homeworkContent.homeworkContentId
        dto.learningItemId = homeworkContent.learningItemId
        dto.content = homeworkContent.content
        dto.dueDate = homeworkContent.dueDate ?? undefined
        dto.competitionId = homeworkContent.competitionId ?? undefined
        dto.allowLateSubmit = homeworkContent.allowLateSubmit
        dto.updatePointsOnLateSubmit = homeworkContent.updatePointsOnLateSubmit
        dto.updatePointsOnReSubmit = homeworkContent.updatePointsOnReSubmit
        dto.updateMaxPoints = homeworkContent.updateMaxPoints
        dto.createdAt = homeworkContent.createdAt
        dto.updatedAt = homeworkContent.updatedAt
        dto.progress = progress
        dto.homeworkSubmit = progress?.homeworkSubmit

        // Map learningItem nếu có
        if (homeworkContent.learningItem) {
            dto.learningItem = LearningItemResponseDto.fromEntity(homeworkContent.learningItem)
        }

        // Map competition nếu có
        if (homeworkContent.competition) {
            dto.competition = {
                competitionId: homeworkContent.competition.competitionId,
                title: homeworkContent.competition.title,
                subtitle: homeworkContent.competition.subtitle ?? undefined,
                startDate: homeworkContent.competition.startDate ?? null,
                endDate: homeworkContent.competition.endDate ?? null,
                visibility: homeworkContent.competition.visibility,
                durationMinutes: homeworkContent.competition.durationMinutes ?? undefined,
                maxAttempts: homeworkContent.competition.maxAttempts ?? undefined,
                examId: homeworkContent.competition.examId ?? undefined,
                allowViewScore: homeworkContent.competition.allowViewScore,
                allowLeaderboard: homeworkContent.competition.allowLeaderboard,
                allowViewSolutionYoutubeUrl: homeworkContent.competition.allowViewSolutionYoutubeUrl,
                allowViewExamContent: homeworkContent.competition.allowViewExamContent,
            }

            // Map exam info nếu có
            if (homeworkContent.competition.exam && dto.competition) {
                dto.competition.exam = {
                    examId: homeworkContent.competition.exam.examId,
                    title: homeworkContent.competition.exam.title,
                    grade: homeworkContent.competition.exam.grade ?? undefined,
                    solutionYoutubeUrl: homeworkContent.competition.allowViewSolutionYoutubeUrl
                        ? (homeworkContent.competition.exam.solutionYoutubeUrl ?? null)
                        : undefined,
                }
            }
        }

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
