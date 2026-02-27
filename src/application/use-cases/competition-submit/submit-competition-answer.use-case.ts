// src/application/use-cases/competition-submit/submit-competition-answer.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import type { ICompetitionAnswerRepository } from '../../../domain/repositories/competition-answer.repository'
import { NotFoundException, ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentAnswerDto } from '../../dtos/competition-submit/competition-exam.dto'
import { SubmitCompetitionAnswerDto } from '../../dtos/competition-submit/submit-competition-answer.dto'
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

@Injectable()
export class SubmitCompetitionAnswerUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('ICompetitionAnswerRepository')
        private readonly competitionAnswerRepository: ICompetitionAnswerRepository,
        @Inject('IQuestionRepository')
        private readonly questionRepository: IQuestionRepository,
    ) { }

    async execute(
        submitId: number,
        answerId: number,
        body: SubmitCompetitionAnswerDto,
        studentId: number,
    ): Promise<BaseResponseDto<StudentAnswerDto>> {
        // 1. Tìm submit và kiểm tra quyền
        const submit = await this.competitionSubmitRepository.findById(submitId)
        if (!submit) {
            throw new NotFoundException(`Lần làm bài với ID ${submitId} không tồn tại`)
        }
        if (submit.studentId !== studentId) {
            throw new ForbiddenException('Bạn không có quyền cập nhật bài làm này')
        }
        if (submit.status !== CompetitionSubmitStatus.IN_PROGRESS) {
            return {
                success: false,
                message: 'Không thể cập nhật câu trả lời vì bài thi đã kết thúc',
                data: null as any,
            }
        }

        // 2. Tìm answer và kiểm tra thuộc về submit này
        const existingAnswer = await this.competitionAnswerRepository.findById(answerId)
        if (!existingAnswer) {
            throw new NotFoundException(`Câu trả lời với ID ${answerId} không tồn tại`)
        }
        if (existingAnswer.competitionSubmitId !== submitId) {
            throw new ForbiddenException('Câu trả lời này không thuộc lần làm bài hiện tại')
        }

        // 3. Lấy câu hỏi với statements để chấm điểm
        const question = await this.questionRepository.findById(existingAnswer.questionId)
        if (!question) {
            throw new NotFoundException(`Câu hỏi với ID ${existingAnswer.questionId} không tồn tại`)
        }
        if (question.correctAnswer) console.log(`Question has correct answer: ${question.correctAnswer}`)
        for (const s of question.statements ?? []) {
            console.log(`Statement ${s.statementId}: isCorrect=${s.isCorrect}`)
        }
        // 4. Xác định selectedStatementIds và trueFalseAnswerJson dựa theo question type
        let selectedStatementIds: number[] = existingAnswer.selectedStatementIds ?? []
        let trueFalseAnswerJson: string | undefined = undefined
        let answeredStatementIds: number[] | null = null  // null = grade hết (non-TRUE_FALSE)

        if (question.type === QuestionType.TRUE_FALSE && body.trueFalseAnswers) {
            // selectedStatementIds = IDs được đánh dấu TRUE
            selectedStatementIds = body.trueFalseAnswers
                .filter(a => a.isTrue === true)
                .map(a => a.statementId)

            // answeredStatementIds = IDs đã có câu trả lời (true hoặc false, không phải null)
            answeredStatementIds = body.trueFalseAnswers
                .filter(a => a.isTrue !== null && a.isTrue !== undefined)
                .map(a => a.statementId)

            // Lưu toàn bộ trạng thái {statementId: boolean|null} vào answer field dưới dạng JSON
            const trueFalseMap: Record<number, boolean | null> = {}
            for (const a of body.trueFalseAnswers) {
                trueFalseMap[a.statementId] = a.isTrue ?? null
            }
            trueFalseAnswerJson = JSON.stringify(trueFalseMap)
        } else if (body.selectedStatementIds !== undefined) {
            selectedStatementIds = body.selectedStatementIds
        }
        console.log(`Selected statement IDs: ${selectedStatementIds}`)
        console.log(`Answered statement IDs: ${answeredStatementIds}`)
        console.log(`TRUE_FALSE JSON to save: ${trueFalseAnswerJson}`)
        // 5. Lưu điểm cũ để tính delta
        const oldPoints = Number(existingAnswer.points ?? 0)

        // 6. Xác định effectiveMaxPoints theo thứ tự ưu tiên:
        //    existingAnswer.maxPoints  ← đã được seed từ QuestionExam.points khi khởi tạo answer
        //      → question.pointsOrigin ← fallback cho answer cũ chưa có maxPoints
        //        → DEFAULT_QUESTION_POINTS[type] ← quy tắc mặc định theo loại câu hỏi
        //    Lưu ý: giá trị 0 được coi là "chưa có điểm" → cần fallback tiếp theo
        const _answerMaxPoints = existingAnswer.maxPoints != null ? Number(existingAnswer.maxPoints) : null
        const _questionOrigin = question.pointsOrigin != null ? Number(question.pointsOrigin) : null
        const effectiveMaxPoints: number | null =
            (_answerMaxPoints != null && _answerMaxPoints > 0)
                ? _answerMaxPoints
                : (_questionOrigin != null && _questionOrigin > 0)
                    ? _questionOrigin
                    : (DEFAULT_QUESTION_POINTS[question.type as QuestionType] ?? null)

        // 7. Chấm điểm tự động
        const gradeResult = this.gradeAnswer(question.type, selectedStatementIds, body.answer, question, effectiveMaxPoints, answeredStatementIds)
        console.log(`Grade result: isCorrect=${gradeResult.isCorrect}, points=${gradeResult.points}, effectiveMaxPoints=${effectiveMaxPoints}`)
        // 8. Cập nhật answer
        // Dùng 'answer' in body để phân biệt "không gửi field" với "gửi empty string"
        // Nếu gửi answer: "" thì vẫn lưu empty string vào DB (isAnswered = false)
        const answerText = trueFalseAnswerJson
            ?? ('answer' in body ? body.answer : existingAnswer.answer)
        const updatedAnswer = await this.competitionAnswerRepository.update(answerId, {
            // TRUE_FALSE: lưu JSON map, các loại khác: lưu text
            answer: answerText,
            selectedStatementIds,
            isCorrect: gradeResult.isCorrect,
            points: gradeResult.points,
            maxPoints: effectiveMaxPoints,
            timeSpentSeconds: body.timeSpentSeconds ?? existingAnswer.timeSpentSeconds,
        })
        console.log(`Updated answer: ${JSON.stringify(updatedAnswer)}`)

        // 9. Tính delta điểm và cập nhật CompetitionSubmit
        const newPoints = Number(updatedAnswer.points ?? 0)
        const delta = newPoints - oldPoints

        console.log(`Điểm cũ: ${oldPoints}, điểm mới: ${newPoints}, delta: ${delta}`)

        if (delta !== 0) {
            const currentTotal = Number(submit.totalPoints ?? 0)
            await this.competitionSubmitRepository.update(submitId, {
                totalPoints: currentTotal + delta,
            })
        }

        return BaseResponseDto.success(
            'Cập nhật câu trả lời thành công',
            StudentAnswerDto.fromExistingAnswer(
                updatedAnswer,
                question.type,
                (question.statements ?? []).map((s: any) => s.statementId),
            ),
        )
    }

    private gradeAnswer(
        type: QuestionType,
        selectedStatementIds: number[],
        textAnswer: string | undefined,
        question: any,
        effectiveMaxPoints: number | null,
        /** IDs đã có câu trả lời (không null) — chỉ dùng cho TRUE_FALSE;
         *  null = grade tất cả statements (backward compat) */
        answeredStatementIds: number[] | null = null,
    ): GradeResult {
        // Helper: điểm toàn phần/bằng 0  (dùng cho các loại không chấm theo phần)
        const pts = (correct: boolean): number | null =>
            effectiveMaxPoints != null ? (correct ? effectiveMaxPoints : 0) : null

        switch (type) {
            // ────────────────────────────────────────────────────────────────────
            // Trắc nghiệm 1 đáp án
            // ────────────────────────────────────────────────────────────────────
            case QuestionType.SINGLE_CHOICE: {
                const correctIds = (question.statements ?? [])
                    .filter((s: any) => s.isCorrect)
                    .map((s: any) => s.statementId)
                const isCorrect =
                    selectedStatementIds.length === 1 &&
                    correctIds.length === 1 &&
                    selectedStatementIds[0] === correctIds[0]
                return { isCorrect, points: pts(isCorrect) }
            }

            // ────────────────────────────────────────────────────────────────────
            // Trắc nghiệm nhiều đáp án
            // ────────────────────────────────────────────────────────────────────
            case QuestionType.MULTIPLE_CHOICE: {
                const correctIds: number[] = (question.statements ?? [])
                    .filter((s: any) => s.isCorrect)
                    .map((s: any) => s.statementId)
                    .sort((a: number, b: number) => a - b)
                const selected = [...selectedStatementIds].sort((a, b) => a - b)
                const isCorrect =
                    selected.length === correctIds.length &&
                    selected.every((id, i) => id === correctIds[i])
                return { isCorrect, points: pts(isCorrect) }
            }

            // ────────────────────────────────────────────────────────────────────
            // Đúng/Sai — chấm theo phần (partial scoring), bỏ qua mệnh đề null
            // ────────────────────────────────────────────────────────────────────
            case QuestionType.TRUE_FALSE: {
                const statements: any[] = question.statements ?? []
                if (statements.length === 0) return { isCorrect: null, points: null }

                // Giới hạn chấm điểm vào những mệnh đề đã trả lời (bỏ qua null)
                const answeredSet = answeredStatementIds !== null
                    ? new Set(answeredStatementIds)
                    : null
                const gradedStatements = answeredSet !== null
                    ? statements.filter((s: any) => answeredSet.has(s.statementId))
                    : statements

                // Nếu chưa trả lời bất kỳ mệnh đề nào → chưa thể chấm
                if (gradedStatements.length === 0) return { isCorrect: null, points: null }

                const selectedSet = new Set(selectedStatementIds)
                const correctCount = gradedStatements.filter(
                    (s: any) => s.isCorrect === selectedSet.has(s.statementId),
                ).length
                const totalCount = statements.length  // vẫn dùng TỔNG số mệnh đề cho bảng điểm
                const allCorrect = correctCount === totalCount

                const maxPts = effectiveMaxPoints ?? 1
                const points = calcTrueFalsePoints(correctCount, totalCount, maxPts)

                return { isCorrect: allCorrect, points }
            }

            // ────────────────────────────────────────────────────────────────────
            // Trả lời ngắn — CHỈ chấp nhận đáp án là số
            // Chấp nhận dấu ',' và '.' làm dấu thập phân, hỗ trợ số âm
            // ────────────────────────────────────────────────────────────────────
            case QuestionType.SHORT_ANSWER: {
                if (!question.correctAnswer) return { isCorrect: null, points: null }

                const correctNum = parseNumericAnswer(question.correctAnswer)
                const studentNum = parseNumericAnswer(textAnswer ?? '')

                // Nếu một trong hai không phải số hợp lệ → không chấm được
                if (correctNum === null || studentNum === null) {
                    return { isCorrect: null, points: null }
                }

                const isCorrect = correctNum === studentNum
                return { isCorrect, points: pts(isCorrect) }
            }

            // ────────────────────────────────────────────────────────────────────
            // Tự luận và các loại khác — chấm thủ công
            // ────────────────────────────────────────────────────────────────────
            case QuestionType.ESSAY:
            default:
                return { isCorrect: null, points: null }
        }
    }
}
