// src/application/dtos/competition/competition-question-stats.dto.ts
import { QuestionType, Difficulty } from '../../../shared/enums'
import { BaseResponseDto } from '../common/base-response.dto'

// ─── Thống kê từng câu hỏi ──────────────────────────────────────────────────

export class QuestionStatItemDto {
    questionId: number
    content: string
    type: QuestionType
    difficulty?: Difficulty | null
    grade?: number | null
    order?: number | null
    sectionId?: number | null
    sectionTitle?: string | null

    /** Tổng số bài nộp GRADED của cuộc thi */
    totalSubmissions: number

    /**
     * Số lần trả lời ĐÚNG câu này (isCorrect = true).
     * Tính trên các bài nộp GRADED; nếu 1 học sinh nộp
     * nhiều lần thì mỗi lần thi được tính riêng.
     */
    correctCount: number

    /**
     * Số lần trả lời SAI hoặc BỎ TRỐNG câu này.
     * wrongCount = totalSubmissions - correctCount
     */
    wrongCount: number

    /** Tỉ lệ đúng (0–100) */
    correctRate: number

    /** Tỉ lệ sai/bỏ trống (0–100) */
    wrongRate: number
}

// ─── Response wrapper ────────────────────────────────────────────────────────

export class CompetitionQuestionStatsDto {
    competitionId: number
    competitionTitle: string
    examId?: number | null

    /** Tổng số bài nộp GRADED */
    totalGradedSubmissions: number

    /** Danh sách thống kê theo từng câu hỏi, sắp xếp theo section rồi order */
    questions: QuestionStatItemDto[]
}

export class CompetitionQuestionStatsResponseDto extends BaseResponseDto<CompetitionQuestionStatsDto> {}
