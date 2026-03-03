// src/application/use-cases/competition/get-competition-question-stats.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionRepository } from '../../../domain/repositories/competition.repository'
import type { IExamRepository } from '../../../domain/repositories/exam.repository'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import type { ICompetitionAnswerRepository } from '../../../domain/repositories/competition-answer.repository'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    CompetitionQuestionStatsDto,
    QuestionStatItemDto,
    CompetitionQuestionStatsResponseDto,
} from '../../dtos/competition/competition-question-stats.dto'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'

/**
 * Thống kê đúng/sai theo từng câu hỏi trong một cuộc thi.
 *
 * Logic:
 *  - Chỉ tính các bài nộp có status = SUBMITTED.
 *  - correctCount[q]  = số bài SUBMITTED mà câu q được chấm isCorrect = true.
 *  - wrongCount[q]    = totalGraded - correctCount[q]
 *    (bao gồm cả trả lời sai lẫn bỏ trống — vì bỏ trống sẽ không có
 *    row với isCorrect = true, hoặc có row với isCorrect = false).
 */
@Injectable()
export class GetCompetitionQuestionStatsUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,

        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,

        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,

        @Inject('ICompetitionAnswerRepository')
        private readonly competitionAnswerRepository: ICompetitionAnswerRepository,
    ) { }

    async execute(competitionId: number): Promise<BaseResponseDto<CompetitionQuestionStatsDto>> {
        // 1. Tìm cuộc thi
        const competition = await this.competitionRepository.findById(competitionId)
        if (!competition) {
            throw new NotFoundException(`Cuộc thi với ID ${competitionId} không tồn tại`)
        }
        if (!competition.examId) {
            throw new NotFoundException('Cuộc thi này chưa được gán đề thi')
        }

        // 2. Lấy đề thi đầy đủ (sections → questions)
        const exam = await this.examRepository.findByIdWithFullDetails(competition.examId)
        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi của cuộc thi này')
        }

        // 3. Đếm tổng số bài nộp SUBMITTED
        const totalGradedSubmissions = await this.competitionSubmitRepository.countByStatus(
            CompetitionSubmitStatus.SUBMITTED,
            competitionId,
        )

        // 4. Lấy số câu trả lời ĐÚNG theo từng questionId (1 DB query duy nhất)
        const correctRows = await this.competitionAnswerRepository.getCorrectCountsByCompetition(competitionId)
        const correctMap = new Map<number, number>(
            correctRows.map((r) => [r.questionId, r.correctCount]),
        )

        // 5. Gom tất cả câu hỏi từ exam (sections + top-level)
        interface QuestionEntry {
            questionId: number
            content: string
            type: any
            difficulty: any
            grade: any
            order: number | null
            sectionId: number | null
            sectionTitle: string | null
        }

        const entries: QuestionEntry[] = []

        // Questions không thuộc section nào
        if ((exam as any).questions) {
            for (const qe of (exam as any).questions as any[]) {
                if (qe.question) {
                    entries.push({
                        questionId: qe.question.questionId,
                        content: qe.question.content,
                        type: qe.question.type,
                        difficulty: qe.question.difficulty ?? null,
                        grade: qe.question.grade ?? null,
                        order: qe.order ?? null,
                        sectionId: null,
                        sectionTitle: null,
                    })
                }
            }
        }

        // 6. Build danh sách QuestionStatItemDto
        const questions: QuestionStatItemDto[] = entries.map((entry) => {
            const correctCount = correctMap.get(entry.questionId) ?? 0
            const wrongCount = totalGradedSubmissions - correctCount
            const correctRate =
                totalGradedSubmissions > 0
                    ? Math.round((correctCount / totalGradedSubmissions) * 100)
                    : 0
            const wrongRate = 100 - correctRate

            return {
                questionId: entry.questionId,
                content: entry.content,
                type: entry.type,
                difficulty: entry.difficulty,
                grade: entry.grade,
                order: entry.order,
                sectionId: entry.sectionId,
                sectionTitle: entry.sectionTitle,
                totalSubmissions: totalGradedSubmissions,
                correctCount,
                wrongCount,
                correctRate,
                wrongRate,
            }
        })

        const dto: CompetitionQuestionStatsDto = {
            competitionId: competition.competitionId,
            competitionTitle: competition.title,
            examId: competition.examId,
            totalGradedSubmissions,
            questions,
        }

        return BaseResponseDto.success('Lấy thống kê câu hỏi thành công', dto)
    }
}
