// src/application/dtos/competition-submit/student-competition-result.dto.ts
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { CompetitionSubmitStatus, QuestionType, Difficulty } from '../../../shared/enums'
import { BaseResponseDto } from '../common/base-response.dto'
import { CompetitionResponseDto } from '../competition/competition.dto'

// ─── Rule flags trên response gốc ──────────────────────────────────────────

export class StudentResultRulesDto {
    allowViewScore: boolean
    showResultDetail: boolean
    allowViewAnswer: boolean
}

// ─── Statement (Rule 2: luôn có content | Rule 3: thêm isCorrect) ───────────

export class StudentStatementResultDto {
    statementId: number
    content: string
    processedContent?: string | null
    order?: number | null
    /** Chỉ có khi allowViewAnswer = true */
    isCorrect?: boolean
}

// ─── Question (Rule 2: có content + statements | Rule 3: thêm đáp án/giải) ─

export class StudentQuestionResultDto {
    questionId: number
    content: string
    processedContent?: string | null
    type: QuestionType
    difficulty?: Difficulty | null
    grade?: number | null
    pointsOrigin?: number | null
    /** Chỉ có khi allowViewAnswer = true */
    correctAnswer?: string | null
    /** Chỉ có khi allowViewAnswer = true */
    solution?: string | null
    processedSolution?: string | null
    /** Chỉ có khi allowViewAnswer = true && allowViewSolutionYoutubeUrl = true */
    solutionYoutubeUrl?: string | null
    statements: StudentStatementResultDto[]
}

// ─── Answer (Rule 2) ────────────────────────────────────────────────────────

export class StudentAnswerResultDto {
    competitionAnswerId: number
    questionId: number
    /** Câu trả lời text của học sinh */
    answer?: string | null
    /** ID các statement đã chọn */
    selectedStatementIds?: number[] | null
    /** Chỉ có khi allowViewScore = true */
    isCorrect?: boolean | null
    /** Chỉ có khi allowViewScore = true */
    points?: number | null
    /** Chỉ có khi allowViewScore = true */
    maxPoints?: number | null
    /** Chỉ có khi allowViewScore = true */
    scorePercentage?: number | null
    createdAt: Date
    /** Câu hỏi đầy đủ – chỉ có khi showResultDetail = true */
    question?: StudentQuestionResultDto | null
}

// ─── Response chính ─────────────────────────────────────────────────────────

export class StudentCompetitionResultDto {
    // Identity
    competitionSubmitId: number
    competitionId: number
    studentId: number
    attemptNumber: number

    // Trạng thái
    status: CompetitionSubmitStatus
    startedAt: Date
    submittedAt?: Date | null

    // ─── Rule 1: allowViewScore ──────────────────────────────────────────────
    /** null khi allowViewScore = false */
    timeSpentSeconds?: number | null
    /** null khi allowViewScore = false */
    totalPoints?: number | null
    /** null khi allowViewScore = false */
    maxPoints?: number | null
    /** null khi allowViewScore = false */
    scorePercentage?: number | null

    createdAt: Date
    updatedAt: Date

    // Computed
    isGraded: boolean
    isInProgress: boolean
    isSubmitted: boolean
    isAbandoned: boolean

    /** Các rule đang áp dụng (để FE biết những gì được xem) */
    rules: StudentResultRulesDto

    /** Thông tin cuộc thi – có khi ít nhất 1 rule được bật */
    competition?: CompetitionResponseDto | null

    // ─── Rule 2: showResultDetail ────────────────────────────────────────────
    /** Chỉ có khi showResultDetail = true */
    answers?: StudentAnswerResultDto[]

    // Thống kê nhanh – chỉ khi showResultDetail = true
    totalAnswers?: number
    /** Chỉ có khi showResultDetail && allowViewScore */
    correctAnswers?: number
    /** Chỉ có khi showResultDetail && allowViewScore */
    incorrectAnswers?: number
    unansweredQuestions?: number

    /**
     * Build DTO từ entity theo 3 rules từ competition.
     *
     * @param submit       bài nộp (kèm competition + answers + questions + statements)
     * @param allowViewScore (Rule 1)
     * @param showResultDetail (Rule 2)
     * @param allowViewAnswer (Rule 3)
     * @param allowViewSolutionYoutubeUrl (gắn với Rule 3)
     */
    static fromEntity(
        submit: CompetitionSubmit,
        allowViewScore: boolean,
        showResultDetail: boolean,
        allowViewAnswer: boolean,
        allowViewSolutionYoutubeUrl: boolean,
    ): StudentCompetitionResultDto {
        const dto = new StudentCompetitionResultDto()

        // Identity
        dto.competitionSubmitId = submit.competitionSubmitId
        dto.competitionId = submit.competitionId
        dto.studentId = submit.studentId
        dto.attemptNumber = submit.attemptNumber

        // Status / timing
        dto.status = submit.status
        dto.startedAt = submit.startedAt
        dto.submittedAt = submit.submittedAt ?? null
        dto.createdAt = submit.createdAt
        dto.updatedAt = submit.updatedAt

        // Computed
        dto.isGraded = submit.isGraded?.() ?? submit.status === 'GRADED' as any
        dto.isInProgress = submit.isInProgress?.() ?? submit.status === 'IN_PROGRESS' as any
        dto.isSubmitted = submit.isSubmitted?.() ?? submit.status === 'SUBMITTED' as any
        dto.isAbandoned = submit.isAbandoned?.() ?? submit.status === 'ABANDONED' as any

        // Rules snapshot
        dto.rules = { allowViewScore, showResultDetail, allowViewAnswer }

        // Competition – trả khi ít nhất 1 rule được bật
        if ((allowViewScore || showResultDetail || allowViewAnswer) && submit.competition) {
            dto.competition = CompetitionResponseDto.fromEntity(submit.competition)
        }

        // ─── Rule 1: allowViewScore ──────────────────────────────────────────
        if (allowViewScore) {
            dto.timeSpentSeconds = submit.timeSpentSeconds ?? null
            dto.totalPoints = submit.totalPoints ?? null
            dto.maxPoints = submit.maxPoints ?? null
            const sp = submit.getScorePercentage?.()
            dto.scorePercentage = sp !== undefined ? sp : (
                submit.totalPoints != null && submit.maxPoints != null && submit.maxPoints > 0
                    ? Math.round((Number(submit.totalPoints) / Number(submit.maxPoints)) * 100)
                    : null
            )
        }

        // ─── Rule 2: showResultDetail ────────────────────────────────────────
        if (showResultDetail) {
            const rawAnswers = submit.competitionAnswers ?? []

            dto.answers = rawAnswers.map((ans) => {
                const aDto = new StudentAnswerResultDto()
                aDto.competitionAnswerId = ans.competitionAnswerId
                aDto.questionId = ans.questionId
                aDto.answer = ans.answer ?? null
                aDto.selectedStatementIds = ans.selectedStatementIds ?? null
                aDto.createdAt = ans.createdAt

                // ─── Rule 2 + Rule 1: điểm từng câu ────────────────────────
                if (allowViewScore) {
                    aDto.isCorrect = ans.isCorrect ?? null
                    aDto.points = ans.points ?? null
                    aDto.maxPoints = ans.maxPoints ?? null
                    const asp = ans.getScorePercentage?.()
                    aDto.scorePercentage = asp !== undefined ? asp : (
                        ans.points != null && ans.maxPoints != null && ans.maxPoints > 0
                            ? Math.round((Number(ans.points) / Number(ans.maxPoints)) * 100)
                            : null
                    )
                }

                // ─── Question + Statements ───────────────────────────────────
                if (ans.question) {
                    const q = ans.question
                    const qDto = new StudentQuestionResultDto()
                    qDto.questionId = q.questionId
                    qDto.content = q.content
                    qDto.type = q.type
                    qDto.difficulty = q.difficulty ?? null
                    qDto.grade = q.grade ?? null
                    qDto.pointsOrigin = q.pointsOrigin ?? null

                    // ─── Rule 3: allowViewAnswer ─────────────────────────────
                    if (allowViewAnswer) {
                        qDto.correctAnswer = q.correctAnswer ?? null
                        qDto.solution = q.solution ?? null
                        qDto.solutionYoutubeUrl = allowViewSolutionYoutubeUrl
                            ? (q.solutionYoutubeUrl ?? null)
                            : null
                    }

                    qDto.statements = (q.statements ?? []).map((s) => {
                        const sDto = new StudentStatementResultDto()
                        sDto.statementId = s.statementId
                        sDto.content = s.content
                        sDto.order = s.order ?? null
                        // ─── Rule 3: isCorrect của statement ────────────────
                        if (allowViewAnswer) {
                            sDto.isCorrect = s.isCorrect
                        }
                        return sDto
                    })

                    aDto.question = qDto
                }

                return aDto
            })

            dto.totalAnswers = dto.answers.length
            dto.unansweredQuestions = dto.answers.filter(
                (a) =>
                    a.answer == null &&
                    (a.selectedStatementIds == null || a.selectedStatementIds.length === 0),
            ).length

            if (allowViewScore) {
                dto.correctAnswers = dto.answers.filter((a) => a.isCorrect === true).length
                dto.incorrectAnswers = dto.answers.filter((a) => a.isCorrect === false).length
            }
        }

        return dto
    }
}

export class StudentCompetitionResultResponseDto extends BaseResponseDto<StudentCompetitionResultDto> { }
