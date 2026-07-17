import { Inject, Injectable, Logger } from '@nestjs/common'
import type {
    IExamAttemptRepository,
    IExamRepository,
    IQuestionAnswerRepository,
    IStudentRepository,
} from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    ForbiddenException,
    NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { ExamAttemptStatus, QuestionType } from '../../../shared/enums'
import {
    DEFAULT_QUESTION_POINTS,
    calcTrueFalsePoints,
    parseNumericAnswer,
} from '../../../shared/constants/grading-rules.constants'
import { CompetitionSubmitFeedbackAiService, type CompetitionSubmitStatsForAi } from 'src/application/interfaces'
import { StudentExamAttemptDetailDto } from '../../dtos/exam-attempt'
import { QuestionTypeLabels } from '../../../shared/enums'

interface GradeResult {
    isCorrect: boolean | null
    points: number | null
}

interface QuestionGradeInfo {
    questionId: number
    type: QuestionType
    examPoints: number | null
    pointsOrigin: number | null
    statements: { statementId: number; isCorrect: boolean | null }[]
    correctAnswer: string | null
}

interface FeedbackStatsCounter {
    total: number
    correct: number
    incorrect: number
    unanswered: number
    ungraded: number
}

@Injectable()
export class SubmitPublicStudentExamAttemptUseCase {
    private readonly logger = new Logger(SubmitPublicStudentExamAttemptUseCase.name)

    constructor(
        @Inject('IExamAttemptRepository')
        private readonly examAttemptRepository: IExamAttemptRepository,
        @Inject('IQuestionAnswerRepository')
        private readonly questionAnswerRepository: IQuestionAnswerRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
        private readonly competitionSubmitFeedbackAiService: CompetitionSubmitFeedbackAiService,
    ) { }

    async execute(
        attemptId: number,
        studentId: number,
    ): Promise<BaseResponseDto<any>> {
        const student = await this.studentRepository.findById(studentId)

        if (!student) {
            throw new NotFoundException('Student profile not found')
        }

        if (!student.user?.isActive) {
            throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
        }

        const attempt = await this.examAttemptRepository.findPublicByAttemptAndStudent(attemptId, studentId)

        if (!attempt) {
            throw new NotFoundException(`Không tìm thấy lượt làm bài với ID ${attemptId}`)
        }

        if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
            return {
                success: false,
                message: 'Bài thi này đã được nộp hoặc đã kết thúc',
                data: null as any,
            }
        }

        const exam = await this.examRepository.findByIdWithFullDetails(attempt.examId)
        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        const questionMap = new Map<number, QuestionGradeInfo>()
        const attemptQuestionIds = attempt.getQuestionIds()
        const allowedQuestionIdSet = new Set<number>(attemptQuestionIds)
        const shouldFilterByAttemptQuestions = allowedQuestionIdSet.size > 0

        if (exam.sections) {
            for (const section of exam.sections) {
                if (section.questions) {
                    for (const qe of section.questions) {
                        if (qe.question) {
                            if (shouldFilterByAttemptQuestions && !allowedQuestionIdSet.has(qe.question.questionId)) {
                                continue
                            }
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

        if (exam.questions) {
            for (const qe of exam.questions) {
                if (qe.question && !qe.sectionId) {
                    if (shouldFilterByAttemptQuestions && !allowedQuestionIdSet.has(qe.question.questionId)) {
                        continue
                    }
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

        const rawAnswers = await this.questionAnswerRepository.findPublicByStudentAndAttempt(studentId, attemptId)
        const answers = shouldFilterByAttemptQuestions
            ? rawAnswers.filter((answer) => allowedQuestionIdSet.has(answer.questionId))
            : rawAnswers

        let gradingUpdatedCount = 0

        for (const answer of answers) {
            const qInfo = questionMap.get(answer.questionId)
            if (!qInfo) continue

            if (qInfo.type === QuestionType.ESSAY) continue

            const effectiveMaxPoints = this.getEffectiveMaxPoints(qInfo)

            const currentMaxPoints = answer.maxPoints != null ? Number(answer.maxPoints) : null
            const maxPointsMismatch = currentMaxPoints !== effectiveMaxPoints

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

            if (grade.points !== null) {
                answer.points = grade.points
                answer.isCorrect = grade.isCorrect
            }
            if (maxPointsMismatch) {
                answer.maxPoints = effectiveMaxPoints
            }

            if (grade.points !== null || maxPointsMismatch) {
                await this.questionAnswerRepository.update(answer.questionAnswerId, {
                    ...(grade.points !== null ? { isCorrect: grade.isCorrect, points: grade.points } : {}),
                    ...(maxPointsMismatch ? { maxPoints: effectiveMaxPoints } : {}),
                })
                gradingUpdatedCount += 1
            }
        }

        const answerMap = new Map<number, { points?: number | null }>()
        for (const answer of answers) {
            answerMap.set(answer.questionId, {
                points: answer.points,
            })
        }

        const scoredQuestionIds = shouldFilterByAttemptQuestions
            ? attemptQuestionIds
            : Array.from(questionMap.keys())

        const totalPoints = scoredQuestionIds.reduce((sum, questionId) => {
            const answer = answerMap.get(questionId)
            return sum + Number(answer?.points ?? 0)
        }, 0)

        const maxPoints = scoredQuestionIds.reduce((sum, questionId) => {
            const qInfo = questionMap.get(questionId)
            if (!qInfo) return sum

            const effectiveMaxPoints = this.getEffectiveMaxPoints(qInfo)
            return sum + Number(effectiveMaxPoints ?? 0)
        }, 0)

        const score = maxPoints > 0
            ? Math.round((totalPoints / maxPoints) * 10000) / 100
            : 0

        const now = new Date()
        const aiFeedback = await this.generateAiFeedbackForAttempt(
            attemptId,
            attempt.examId,
            studentId,
            scoredQuestionIds,
            questionMap,
            answers,
            totalPoints,
            maxPoints,
            score,
        )

        const submittedAttempt = await this.examAttemptRepository.submitAttempt(attemptId, {
            status: ExamAttemptStatus.SUBMITTED,
            endAt: now,
            gradedAt: now,
            score,
            points: totalPoints,
            maxPoints,
            feedback: aiFeedback,
        })

        return BaseResponseDto.success('Nộp bài thành công', {
            attempt: StudentExamAttemptDetailDto.fromEntity(submittedAttempt),
            answersGradedOnFinish: gradingUpdatedCount,
            feedback: aiFeedback,
            feedbackSource: aiFeedback ? 'exam_attempt' : null,
        })
    }

    private async generateAiFeedbackForAttempt(
        attemptId: number,
        examId: number,
        studentId: number,
        scoredQuestionIds: number[],
        questionMap: Map<number, QuestionGradeInfo>,
        answers: Array<any>,
        totalPoints: number,
        maxPoints: number,
        scorePercentage: number,
    ): Promise<string | null> {
        try {
            const stats = this.buildAttemptStats(
                attemptId,
                examId,
                studentId,
                scoredQuestionIds,
                questionMap,
                answers,
                totalPoints,
                maxPoints,
                scorePercentage,
            )

            const feedback = await this.competitionSubmitFeedbackAiService.generateFeedbackFromStatistics(stats)
            return feedback || null
        } catch (error: any) {
            this.logger.warn(`Không tạo được feedback cho examAttemptId=${attemptId}: ${error?.message || 'Unknown error'}`)
            return null
        }
    }

    private buildAttemptStats(
        attemptId: number,
        examId: number,
        studentId: number,
        scoredQuestionIds: number[],
        questionMap: Map<number, QuestionGradeInfo>,
        answers: Array<any>,
        totalPoints: number,
        maxPoints: number,
        scorePercentage: number,
    ): CompetitionSubmitStatsForAi {
        const answerMap = new Map<number, any>(answers.map((a) => [a.questionId, a]))
        const totals = this.createEmptyCounter()
        const byTypeMap = new Map<string, { key: string; label: string; counts: FeedbackStatsCounter }>()

        for (const questionId of scoredQuestionIds) {
            const qInfo = questionMap.get(questionId)
            if (!qInfo) {
                continue
            }

            const answer = answerMap.get(questionId)
            const status = this.resolveAnswerStatus(answer)

            this.incrementCounter(totals, status, answer)

            const key = qInfo.type
            const label = (QuestionTypeLabels as Record<string, string>)[qInfo.type] || qInfo.type
            const existing = byTypeMap.get(key) || {
                key,
                label,
                counts: this.createEmptyCounter(),
            }

            this.incrementCounter(existing.counts, status, answer)
            byTypeMap.set(key, existing)
        }

        return {
            competitionSubmitId: attemptId,
            competitionId: 0,
            examId,
            studentId,
            totalPoints,
            maxPoints,
            scorePercentage,
            totals,
            bySection: [],
            byChapter: [],
            byDifficulty: [],
            byQuestionType: Array.from(byTypeMap.values()),
        }
    }

    private createEmptyCounter(): FeedbackStatsCounter {
        return {
            total: 0,
            correct: 0,
            incorrect: 0,
            unanswered: 0,
            ungraded: 0,
        }
    }

    private resolveAnswerStatus(answer: any): 'correct' | 'incorrect' | 'unanswered' {
        if (!answer) {
            return 'unanswered'
        }

        const hasTextAnswer = Boolean(answer.answer && String(answer.answer).trim().length > 0)
        const hasSelectedStatements = Boolean(answer.selectedStatementIds && answer.selectedStatementIds.length > 0)
        const hasAnyAnswer = hasTextAnswer || hasSelectedStatements

        if (!hasAnyAnswer) {
            return 'unanswered'
        }

        if (answer.isCorrect === true) {
            return 'correct'
        }

        return 'incorrect'
    }

    private incrementCounter(
        counter: FeedbackStatsCounter,
        status: 'correct' | 'incorrect' | 'unanswered',
        answer?: any,
    ): void {
        counter.total += 1
        counter[status] += 1
        if (status === 'incorrect' && answer?.isCorrect == null) {
            counter.ungraded += 1
        }
    }

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
            case QuestionType.SINGLE_CHOICE: {
                const correctIds = question.statements
                    .filter((s) => s.isCorrect)
                    .map((s) => s.statementId)
                const isCorrect =
                    selectedStatementIds.length === 1 &&
                    correctIds.length === 1 &&
                    selectedStatementIds[0] === correctIds[0]
                return { isCorrect, points: pts(isCorrect) }
            }

            case QuestionType.MULTIPLE_CHOICE: {
                const correctIds = question.statements
                    .filter((s) => s.isCorrect)
                    .map((s) => s.statementId)
                    .sort((a, b) => a - b)
                const selected = [...selectedStatementIds].sort((a, b) => a - b)
                const isCorrect =
                    selected.length === correctIds.length &&
                    selected.every((id, i) => id === correctIds[i])
                return { isCorrect, points: pts(isCorrect) }
            }

            case QuestionType.TRUE_FALSE: {
                const statements = question.statements
                if (statements.length === 0) return { isCorrect: null, points: null }

                const answeredSet = answeredStatementIds !== null
                    ? new Set(answeredStatementIds)
                    : null
                const gradedStatements = answeredSet !== null
                    ? statements.filter((s) => answeredSet.has(s.statementId))
                    : statements

                if (gradedStatements.length === 0) return { isCorrect: null, points: null }

                const selectedSet = new Set(selectedStatementIds)
                const correctCount = gradedStatements.filter(
                    (s) => s.isCorrect === selectedSet.has(s.statementId),
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

    private getEffectiveMaxPoints(question: QuestionGradeInfo): number | null {
        const examPoints = question.examPoints != null && question.examPoints > 0 ? question.examPoints : null
        const questionOrigin = question.pointsOrigin != null && question.pointsOrigin > 0 ? question.pointsOrigin : null

        return examPoints ?? questionOrigin ?? (DEFAULT_QUESTION_POINTS[question.type] ?? null)
    }
}
