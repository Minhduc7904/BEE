// src/application/use-cases/competition-submit/regrade-competition-submit.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository, IExamRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import type { ICompetitionAnswerRepository } from '../../../domain/repositories/competition-answer.repository'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories/homework-submit.repository'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { QuestionType } from '../../../shared/enums'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import {
    DEFAULT_QUESTION_POINTS,
    calcTrueFalsePoints,
    parseNumericAnswer,
} from '../../../shared/constants/grading-rules.constants'

interface GradeResult {
    isCorrect: boolean | null
    points: number | null
}

interface QuestionGradeInfo {
    questionId: number
    type: QuestionType
    /** Điểm override per-exam từ QuestionExam.points — ưu tiên cao nhất, giống get-competition-answers */
    examPoints: number | null
    pointsOrigin: number | null
    statements: { statementId: number; isCorrect: boolean | null }[]
    correctAnswer: string | null
}

@Injectable()
export class RegradeCompetitionSubmitUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('ICompetitionAnswerRepository')
        private readonly competitionAnswerRepository: ICompetitionAnswerRepository,
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('IHomeworkSubmitRepository')
        private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    ) { }

    async execute(submitId: number): Promise<BaseResponseDto<any>> {
        // 1. Tìm submit — không kiểm tra student hay trạng thái (admin hành động)
        const submit = await this.competitionSubmitRepository.findById(submitId)
        if (!submit) {
            throw new NotFoundException(`Lần làm bài với ID ${submitId} không tồn tại`)
        }

        // 2. Lấy toàn bộ câu trả lời của lần làm bài này
        const answers = await this.competitionAnswerRepository.findByCompetitionSubmit(submitId)

        // 3. Tải cuộc thi và đề thi
        const competition = await this.competitionRepository.findById(submit.competitionId)
        if (!competition) {
            throw new NotFoundException('Cuộc thi không tồn tại')
        }
        if (!competition.examId) {
            throw new NotFoundException('Cuộc thi này không có đề thi')
        }

        const exam = await this.examRepository.findByIdWithFullDetails(competition.examId)
        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        // 4. Build questionId → QuestionGradeInfo map từ exam
        const questionMap = new Map<number, QuestionGradeInfo>()

        // Questions trong sections
        if (exam.sections) {
            for (const section of exam.sections) {
                if (section.questions) {
                    for (const qe of section.questions) {
                        if (qe.question) {
                            questionMap.set(qe.question.questionId, {
                                questionId: qe.question.questionId,
                                type: qe.question.type,
                                examPoints: qe.points != null ? Number(qe.points) : null,
                                pointsOrigin: qe.question.pointsOrigin != null ? Number(qe.question.pointsOrigin) : null,
                                statements: (qe.question.statements ?? []).map((s: any) => ({
                                    statementId: s.statementId,
                                    isCorrect: s.isCorrect ?? null,
                                })),
                                correctAnswer: qe.question.correctAnswer ?? null,
                            })
                        }
                    }
                }
            }
        }

        // Questions không thuộc section nào
        if (exam.questions) {
            for (const qe of exam.questions) {
                if (qe.question && !qe.sectionId) {
                    questionMap.set(qe.question.questionId, {
                        questionId: qe.question.questionId,
                        type: qe.question.type,
                        examPoints: qe.points != null ? Number(qe.points) : null,
                        pointsOrigin: qe.question.pointsOrigin != null ? Number(qe.question.pointsOrigin) : null,
                        statements: (qe.question.statements ?? []).map((s: any) => ({
                            statementId: s.statementId,
                            isCorrect: s.isCorrect ?? null,
                        })),
                        correctAnswer: qe.question.correctAnswer ?? null,
                    })
                }
            }
        }

        // 5. Chấm lại TẤT CẢ câu trả lời (trừ ESSAY)
        //    Đồng thời kiểm tra và cập nhật lại maxPoints nếu lệch với logic đề thi
        const gradingUpdates: { id: number; data: { isCorrect?: boolean | null; points?: number | null; maxPoints?: number | null } }[] = []

        for (const answer of answers) {
            const qInfo = questionMap.get(answer.questionId)
            if (!qInfo) continue

            // ESSAY không tự chấm được
            if (qInfo.type === QuestionType.ESSAY) continue

            // Xác định effectiveMaxPoints — giống logic get-competition-answers và finish:
            // ưu tiên examPoints (qe.points per-exam override) → pointsOrigin → DEFAULT
            const _examPoints = qInfo.examPoints != null && qInfo.examPoints > 0 ? qInfo.examPoints : null
            const _questionOrigin = qInfo.pointsOrigin != null && qInfo.pointsOrigin > 0 ? qInfo.pointsOrigin : null
            const effectiveMaxPoints: number | null =
                _examPoints ?? _questionOrigin ?? (DEFAULT_QUESTION_POINTS[qInfo.type] ?? null)

            // Kiểm tra xem maxPoints hiện tại của answer có khớp không
            const currentMaxPoints = answer.maxPoints != null ? Number(answer.maxPoints) : null
            const maxPointsMismatch = currentMaxPoints !== effectiveMaxPoints

            // Parse answeredStatementIds từ JSON nếu là TRUE_FALSE
            let answeredStatementIds: number[] | null = null
            if (qInfo.type === QuestionType.TRUE_FALSE) {
                if (answer.answer) {
                    try {
                        const parsed = JSON.parse(answer.answer) as Record<string, boolean | null>
                        answeredStatementIds = Object.entries(parsed)
                            .filter(([, v]) => v !== null)
                            .map(([k]) => parseInt(k, 10))
                    } catch {
                        answeredStatementIds = answer.selectedStatementIds ?? []
                    }
                } else {
                    answeredStatementIds = []
                }
            }

            const grade = this.gradeAnswer(
                qInfo.type,
                answer.selectedStatementIds ?? [],
                answer.answer ?? undefined,
                qInfo,
                effectiveMaxPoints,
                answeredStatementIds,
            )

            // Cập nhật in-memory
            if (grade.points !== null) {
                answer.points = grade.points
                answer.isCorrect = grade.isCorrect
            }
            if (maxPointsMismatch) {
                answer.maxPoints = effectiveMaxPoints
            }

            // Ghi vào DB nếu có thay đổi (điểm chấm hoặc maxPoints lệch)
            if (grade.points !== null || maxPointsMismatch) {
                gradingUpdates.push({
                    id: answer.competitionAnswerId,
                    data: {
                        ...(grade.points !== null ? { isCorrect: grade.isCorrect, points: grade.points } : {}),
                        ...(maxPointsMismatch ? { maxPoints: effectiveMaxPoints } : {}),
                    },
                })
            }
        }

        // 6. Ghi kết quả chấm vào DB (batch update)
        if (gradingUpdates.length > 0) {
            await this.competitionAnswerRepository.updateMany(gradingUpdates)
        }

        // 7. Tính tổng điểm và điểm tối đa
        const totalPoints = answers.reduce((sum, a) => sum + Number(a.points ?? 0), 0)
        const maxPoints = answers.reduce((sum, a) => sum + Number(a.maxPoints ?? 0), 0)
        const now = new Date()

        // 8. Cập nhật submit: SUBMITTED + tổng điểm mới
        const updatedSubmit = await this.competitionSubmitRepository.update(submitId, {
            status: CompetitionSubmitStatus.SUBMITTED,
            gradedAt: now,
            totalPoints,
            maxPoints,
        })

        // 9. Trả về kết quả
        const scorePercentage = maxPoints > 0
            ? Math.round((totalPoints / maxPoints) * 10000) / 100
            : 0

        // 10. Cập nhật điểm HomeworkSubmit liên kết (nếu có)
        let homeworkSubmitUpdated: { homeworkSubmitId: number; points: number } | null = null
        const linkedHomeworkSubmit = await this.homeworkSubmitRepository.findByCompetitionSubmitId(submitId)
        if (linkedHomeworkSubmit) {
            await this.homeworkSubmitRepository.update(linkedHomeworkSubmit.homeworkSubmitId, {
                points: totalPoints,
            })
            homeworkSubmitUpdated = {
                homeworkSubmitId: linkedHomeworkSubmit.homeworkSubmitId,
                points: totalPoints,
            }
        }

        return BaseResponseDto.success('Chấm điểm lại thành công', {
            competitionSubmitId: submitId,
            competitionId: submit.competitionId,
            studentId: submit.studentId,
            attemptNumber: submit.attemptNumber,
            status: updatedSubmit.status,
            gradedAt: updatedSubmit.gradedAt,
            totalPoints,
            maxPoints,
            scorePercentage,
            answersRegraded: gradingUpdates.length,
            totalAnswers: answers.length,
            homeworkSubmitUpdated,
        })
    }

    /**
     * Chấm điểm cho một câu trả lời — logic giống finish-competition-submit.use-case.ts
     */
    private gradeAnswer(
        type: QuestionType,
        selectedStatementIds: number[],
        textAnswer: string | undefined,
        question: QuestionGradeInfo,
        effectiveMaxPoints: number | null,
        answeredStatementIds: number[] | null = null,
    ): GradeResult {
        const pts = (correct: boolean): number | null =>
            effectiveMaxPoints != null ? (correct ? effectiveMaxPoints : 0) : null

        switch (type) {
            // ─────────────────────────────────────────────────────────────────
            // Trắc nghiệm 1 đáp án
            // ─────────────────────────────────────────────────────────────────
            case QuestionType.SINGLE_CHOICE: {
                const correctIds = question.statements
                    .filter(s => s.isCorrect)
                    .map(s => s.statementId)
                const isCorrect =
                    selectedStatementIds.length === 1 &&
                    correctIds.length === 1 &&
                    selectedStatementIds[0] === correctIds[0]
                return { isCorrect, points: pts(isCorrect) }
            }

            // ─────────────────────────────────────────────────────────────────
            // Trắc nghiệm nhiều đáp án
            // ─────────────────────────────────────────────────────────────────
            case QuestionType.MULTIPLE_CHOICE: {
                const correctIds = question.statements
                    .filter(s => s.isCorrect)
                    .map(s => s.statementId)
                    .sort((a, b) => a - b)
                const selected = [...selectedStatementIds].sort((a, b) => a - b)
                const isCorrect =
                    selected.length === correctIds.length &&
                    selected.every((id, i) => id === correctIds[i])
                return { isCorrect, points: pts(isCorrect) }
            }

            // ─────────────────────────────────────────────────────────────────
            // Đúng/Sai — chấm theo phần (partial scoring)
            // ─────────────────────────────────────────────────────────────────
            case QuestionType.TRUE_FALSE: {
                const statements = question.statements
                if (statements.length === 0) return { isCorrect: null, points: null }

                const answeredSet = answeredStatementIds !== null
                    ? new Set(answeredStatementIds)
                    : null
                const gradedStatements = answeredSet !== null
                    ? statements.filter(s => answeredSet.has(s.statementId))
                    : statements

                if (gradedStatements.length === 0) return { isCorrect: null, points: null }

                const selectedSet = new Set(selectedStatementIds)
                const correctCount = gradedStatements.filter(
                    s => s.isCorrect === selectedSet.has(s.statementId),
                ).length
                const totalCount = statements.length
                const allCorrect = correctCount === totalCount

                const maxPts = effectiveMaxPoints ?? 1
                const points = calcTrueFalsePoints(correctCount, totalCount, maxPts)

                return { isCorrect: allCorrect, points }
            }

            // ─────────────────────────────────────────────────────────────────
            // Trả lời ngắn
            // ─────────────────────────────────────────────────────────────────
            case QuestionType.SHORT_ANSWER: {
                if (!question.correctAnswer) return { isCorrect: null, points: null }

                const correctNum = parseNumericAnswer(question.correctAnswer)
                const studentNum = parseNumericAnswer(textAnswer ?? '')

                if (correctNum === null || studentNum === null) {
                    return { isCorrect: null, points: null }
                }

                const isCorrect = correctNum === studentNum
                return { isCorrect, points: pts(isCorrect) }
            }

            // ─────────────────────────────────────────────────────────────────
            // Tự luận và các loại khác
            // ─────────────────────────────────────────────────────────────────
            case QuestionType.ESSAY:
            default:
                return { isCorrect: null, points: null }
        }
    }
}
