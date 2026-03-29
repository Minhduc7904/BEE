import { Inject, Injectable } from '@nestjs/common'
import type {
    IExamAttemptRepository,
    IQuestionAnswerRepository,
    IQuestionRepository,
    IStudentRepository,
} from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { SubmitStudentQuestionAnswerDto } from '../../dtos/question-answer/submit-student-question-answer.dto'
import { StudentQuestionAnswerItemDto } from '../../dtos/question-answer/student-question-answer.dto'
import {
    ForbiddenException,
    NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { ExamAttemptStatus, QuestionType } from '../../../shared/enums'
import {
    calcTrueFalsePoints,
    DEFAULT_QUESTION_POINTS,
    parseNumericAnswer,
} from '../../../shared/constants/grading-rules.constants'

interface GradeResult {
    isCorrect: boolean | null
    points: number | null
}

@Injectable()
export class SubmitPublicStudentQuestionAnswerUseCase {
    constructor(
        @Inject('IQuestionAnswerRepository')
        private readonly questionAnswerRepository: IQuestionAnswerRepository,
        @Inject('IQuestionRepository')
        private readonly questionRepository: IQuestionRepository,
        @Inject('IExamAttemptRepository')
        private readonly examAttemptRepository: IExamAttemptRepository,
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(
        studentId: number,
        body: SubmitStudentQuestionAnswerDto,
    ): Promise<BaseResponseDto<StudentQuestionAnswerItemDto>> {
        const student = await this.studentRepository.findById(studentId)

        if (!student) {
            throw new NotFoundException('Student profile not found')
        }

        if (!student.user?.isActive) {
            throw new ForbiddenException('Tai khoan da bi vo hieu hoa')
        }

        let attemptMaxPoints: number | null = null

        if (body.attemptId) {
            const attempt = await this.examAttemptRepository.findPublicByAttemptAndStudent(
                body.attemptId,
                studentId,
            )

            if (!attempt) {
                throw new NotFoundException(`Khong tim thay luot lam bai voi ID ${body.attemptId}`)
            }

            if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
                throw new ForbiddenException('Khong the cap nhat cau tra loi vi bai thi da ket thuc')
            }

            attemptMaxPoints = attempt.maxPoints != null ? Number(attempt.maxPoints) : null
        }

        const question = await this.questionRepository.findById(body.questionId)
        if (!question) {
            throw new NotFoundException(`Cau hoi voi ID ${body.questionId} khong ton tai`)
        }

        const existing = await this.questionAnswerRepository.findByAttemptAndQuestion(
            body.attemptId ?? null,
            body.questionId,
        )

        let selectedStatementIds: number[] = existing?.selectedStatementIds ?? []
        let trueFalseAnswerJson: string | undefined = undefined
        let answeredStatementIds: number[] | null = null

        if (question.type === QuestionType.TRUE_FALSE && body.trueFalseAnswers) {
            selectedStatementIds = body.trueFalseAnswers
                .filter((a) => a.isTrue === true)
                .map((a) => a.statementId)

            answeredStatementIds = body.trueFalseAnswers
                .filter((a) => a.isTrue !== null && a.isTrue !== undefined)
                .map((a) => a.statementId)

            const trueFalseMap: Record<number, boolean | null> = {}
            for (const a of body.trueFalseAnswers) {
                trueFalseMap[a.statementId] = a.isTrue ?? null
            }
            trueFalseAnswerJson = JSON.stringify(trueFalseMap)
        } else if (body.selectedStatementIds !== undefined) {
            selectedStatementIds = body.selectedStatementIds
        }

        const answerMaxPoints = existing?.maxPoints != null ? Number(existing.maxPoints) : null
        const questionOrigin = question.pointsOrigin != null ? Number(question.pointsOrigin) : null
        const effectiveMaxPoints: number | null =
            answerMaxPoints != null && answerMaxPoints > 0
                ? answerMaxPoints
                : questionOrigin != null && questionOrigin > 0
                    ? questionOrigin
                    : DEFAULT_QUESTION_POINTS[question.type as QuestionType] ?? null

        const gradeResult = this.gradeAnswer(
            question.type,
            selectedStatementIds,
            body.answer,
            question,
            effectiveMaxPoints,
            answeredStatementIds,
        )

        const answerText =
            trueFalseAnswerJson ?? ('answer' in body ? body.answer : (existing?.answer ?? undefined))

        const previousTimeSpentSeconds = Number(existing?.timeSpentSeconds ?? 0)
        const deltaTimeSpentSeconds = Number(body.timeSpentSeconds ?? 0)
        const accumulatedTimeSpentSeconds = previousTimeSpentSeconds + deltaTimeSpentSeconds

        const saved = existing
            ? await this.questionAnswerRepository.update(existing.questionAnswerId, {
                answer: answerText,
                selectedStatementIds,
                isCorrect: gradeResult.isCorrect,
                points: gradeResult.points,
                maxPoints: effectiveMaxPoints,
                timeSpentSeconds: accumulatedTimeSpentSeconds,
            })
            : await this.questionAnswerRepository.create({
                attemptId: body.attemptId ?? null,
                questionId: body.questionId,
                answer: answerText,
                selectedStatementIds,
                isCorrect: gradeResult.isCorrect,
                points: gradeResult.points,
                maxPoints: effectiveMaxPoints,
                timeSpentSeconds: accumulatedTimeSpentSeconds,
            })

        if (body.attemptId) {
            const totals = await this.questionAnswerRepository.calculateAttemptTotals(body.attemptId)
            const maxPointsForScore = totals.maxPoints > 0
                ? totals.maxPoints
                : (attemptMaxPoints != null && attemptMaxPoints > 0 ? attemptMaxPoints : 0)
            const score = maxPointsForScore > 0
                ? Math.round((totals.totalPoints / maxPointsForScore) * 1000) / 100
                : null

            await this.examAttemptRepository.updateScoring(body.attemptId, {
                points: totals.totalPoints,
                maxPoints: totals.maxPoints,
                score,
            })
        }

        return BaseResponseDto.success(
            existing ? 'Cap nhat cau tra loi thanh cong' : 'Tao cau tra loi thanh cong',
            StudentQuestionAnswerItemDto.fromEntity(saved),
        )
    }

    private gradeAnswer(
        type: QuestionType,
        selectedStatementIds: number[],
        textAnswer: string | undefined,
        question: any,
        effectiveMaxPoints: number | null,
        answeredStatementIds: number[] | null = null,
    ): GradeResult {
        const pts = (correct: boolean): number | null =>
            effectiveMaxPoints != null ? (correct ? effectiveMaxPoints : 0) : null

        switch (type) {
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

            case QuestionType.TRUE_FALSE: {
                const statements: any[] = question.statements ?? []
                if (statements.length === 0) return { isCorrect: null, points: null }

                const answeredSet = answeredStatementIds !== null
                    ? new Set(answeredStatementIds)
                    : null
                const gradedStatements = answeredSet !== null
                    ? statements.filter((s: any) => answeredSet.has(s.statementId))
                    : statements

                if (gradedStatements.length === 0) return { isCorrect: null, points: null }

                const selectedSet = new Set(selectedStatementIds)
                const correctCount = gradedStatements.filter(
                    (s: any) => s.isCorrect === selectedSet.has(s.statementId),
                ).length
                const totalCount = statements.length
                const allCorrect = correctCount === totalCount

                const maxPts = effectiveMaxPoints ?? 1
                const points = calcTrueFalsePoints(correctCount, totalCount, maxPts)

                return { isCorrect: allCorrect, points }
            }

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

            case QuestionType.ESSAY:
            default:
                return { isCorrect: null, points: null }
        }
    }
}
