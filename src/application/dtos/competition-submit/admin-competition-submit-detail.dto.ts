// src/application/dtos/competition-submit/admin-competition-submit-detail.dto.ts
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { CompetitionSubmitStatus, QuestionType, Difficulty } from '../../../shared/enums'
import { BaseResponseDto } from '../common/base-response.dto'
import { StudentResponseDto } from '../student/student.dto'
import { CompetitionResponseDto } from '../competition/competition.dto'

// ─── Statement chi tiết (có isCorrect cho admin xem) ───────────────────────

export class AdminStatementDetailDto {
    statementId: number
    content: string
    isCorrect: boolean
    order?: number | null
    difficulty?: Difficulty | null
    createdAt: Date
    updatedAt: Date
}

// ─── Question chi tiết (bao gồm đáp án, lời giải, statements) ──────────────

export class AdminQuestionDetailDto {
    questionId: number
    content: string
    type: QuestionType
    correctAnswer?: string | null
    solution?: string | null
    solutionYoutubeUrl?: string | null
    difficulty?: Difficulty | null
    grade?: number | null
    pointsOrigin?: number | null
    statements: AdminStatementDetailDto[]
}

// ─── Answer chi tiết (gắn kèm câu hỏi + statements) ───────────────────────

export class AdminCompetitionAnswerDetailDto {
    // Identity
    competitionAnswerId: number
    competitionSubmitId: number
    questionId: number

    // Câu trả lời của học sinh
    answer?: string | null
    selectedStatementIds?: number[] | null

    // Chấm điểm
    isCorrect?: boolean | null
    points?: number | null
    maxPoints?: number | null
    scorePercentage?: number | null

    // Metadata
    createdAt: Date
    updatedAt: Date

    // Câu hỏi đầy đủ (bao gồm statements)
    question?: AdminQuestionDetailDto | null
}

// ─── Response chính cho admin xem chi tiết bài nộp ─────────────────────────

export class AdminCompetitionSubmitDetailDto {
    // Identity
    competitionSubmitId: number
    competitionId: number
    studentId: number
    attemptNumber: number

    // Trạng thái
    status: CompetitionSubmitStatus

    // Thời gian
    startedAt?: Date
    submittedAt?: Date
    timeSpentSeconds?: number

    // Điểm số
    totalPoints?: number
    maxPoints?: number
    scorePercentage?: number | null

    // Metadata
    createdAt: Date
    updatedAt: Date

    // Computed
    isInProgress: boolean
    isSubmitted: boolean
    isAbandoned: boolean
    isGraded: boolean
    hasScore: boolean
    timeSpentDisplay?: string

    // Relations
    competition?: CompetitionResponseDto
    student?: StudentResponseDto

    // Danh sách câu trả lời đầy đủ (kèm question + statements)
    answers: AdminCompetitionAnswerDetailDto[]

    // Thống kê nhanh
    totalAnswers: number
    correctAnswers: number
    incorrectAnswers: number
    unansweredQuestions: number

    static fromEntity(entity: CompetitionSubmit): AdminCompetitionSubmitDetailDto {
        const dto = new AdminCompetitionSubmitDetailDto()

        // Identity
        dto.competitionSubmitId = entity.competitionSubmitId
        dto.competitionId = entity.competitionId
        dto.studentId = entity.studentId
        dto.attemptNumber = entity.attemptNumber

        // Status
        dto.status = entity.status

        // Timing
        dto.startedAt = entity.startedAt ?? undefined
        dto.submittedAt = entity.submittedAt ?? undefined
        dto.timeSpentSeconds = entity.timeSpentSeconds ?? undefined

        // Scoring
        dto.totalPoints = entity.totalPoints ?? undefined
        dto.maxPoints = entity.maxPoints ?? undefined
        dto.scorePercentage = entity.getScorePercentage() ?? null

        // Metadata
        dto.createdAt = entity.createdAt
        dto.updatedAt = entity.updatedAt

        // Computed
        dto.isInProgress = entity.isInProgress()
        dto.isSubmitted = entity.isSubmitted()
        dto.isAbandoned = entity.isAbandoned()
        dto.isGraded = entity.isGraded()
        dto.hasScore = entity.hasScore()
        dto.timeSpentDisplay = entity.getTimeSpentDisplay() ?? undefined

        // Relations
        if (entity.competition) {
            dto.competition = CompetitionResponseDto.fromEntity(entity.competition)
        }

        if (entity.student?.user) {
            dto.student = StudentResponseDto.fromUserWithStudent(entity.student.user, entity.student)
        }

        // Map answers với đầy đủ question + statements
        const answers = entity.competitionAnswers ?? []
        dto.answers = answers.map((ans) => {
            const ansDto = new AdminCompetitionAnswerDetailDto()

            ansDto.competitionAnswerId = ans.competitionAnswerId
            ansDto.competitionSubmitId = ans.competitionSubmitId
            ansDto.questionId = ans.questionId
            ansDto.answer = ans.answer ?? null
            ansDto.selectedStatementIds = ans.selectedStatementIds ?? null
            ansDto.isCorrect = ans.isCorrect ?? null
            ansDto.points = ans.points ?? null
            ansDto.maxPoints = ans.maxPoints ?? null
            ansDto.scorePercentage = ans.getScorePercentage() ?? null
            ansDto.createdAt = ans.createdAt
            ansDto.updatedAt = ans.updatedAt

            // Map question + statements
            if (ans.question) {
                const q = ans.question
                const qDto = new AdminQuestionDetailDto()

                qDto.questionId = q.questionId
                qDto.content = q.content
                qDto.type = q.type
                qDto.correctAnswer = q.correctAnswer ?? null
                qDto.solution = q.solution ?? null
                qDto.solutionYoutubeUrl = q.solutionYoutubeUrl ?? null
                qDto.difficulty = q.difficulty ?? null
                qDto.grade = q.grade ?? null
                qDto.pointsOrigin = q.pointsOrigin ?? null

                qDto.statements = (q.statements ?? []).map((s) => {
                    const sDto = new AdminStatementDetailDto()
                    sDto.statementId = s.statementId
                    sDto.content = s.content
                    sDto.isCorrect = s.isCorrect
                    sDto.order = s.order ?? null
                    sDto.difficulty = s.difficulty ?? null
                    sDto.createdAt = s.createdAt
                    sDto.updatedAt = s.updatedAt
                    return sDto
                })

                ansDto.question = qDto
            }

            return ansDto
        })

        // Tổng hợp thống kê
        dto.totalAnswers = dto.answers.length
        dto.correctAnswers = dto.answers.filter((a) => a.isCorrect === true).length
        dto.incorrectAnswers = dto.answers.filter((a) => a.isCorrect === false).length
        dto.unansweredQuestions = dto.answers.filter(
            (a) => a.answer == null && (a.selectedStatementIds == null || a.selectedStatementIds.length === 0),
        ).length

        return dto
    }
}

export class AdminCompetitionSubmitDetailResponseDto extends BaseResponseDto<AdminCompetitionSubmitDetailDto> {}
