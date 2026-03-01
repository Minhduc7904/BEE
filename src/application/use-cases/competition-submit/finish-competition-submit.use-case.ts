// src/application/use-cases/competition-submit/finish-competition-submit.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository, IExamRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import type { ICompetitionAnswerRepository } from '../../../domain/repositories/competition-answer.repository'
import type { IHomeworkContentRepository } from '../../../domain/repositories/homework-content.repository'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories/homework-submit.repository'
import { NotFoundException, ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
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
    pointsOrigin: number | null
    /** Tất cả statements với isCorrect để chấm điểm */
    statements: { statementId: number; isCorrect: boolean | null }[]
    /** correctAnswer dùng cho SHORT_ANSWER */
    correctAnswer: string | null
}

@Injectable()
export class FinishCompetitionSubmitUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('ICompetitionAnswerRepository')
        private readonly competitionAnswerRepository: ICompetitionAnswerRepository,
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('IHomeworkContentRepository')
        private readonly homeworkContentRepository: IHomeworkContentRepository,
        @Inject('IHomeworkSubmitRepository')
        private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    ) { }

    async execute(
        submitId: number,
        studentId: number,
        homeworkContentId?: number | string,
    ): Promise<BaseResponseDto<any>> {
        // 1. Tìm submit và kiểm tra quyền
        const submit = await this.competitionSubmitRepository.findById(submitId)
        if (!submit) {
            throw new NotFoundException(`Lần làm bài với ID ${submitId} không tồn tại`)
        }
        if (submit.studentId !== studentId) {
            throw new ForbiddenException('Bạn không có quyền nộp bài làm này')
        }
        if (submit.status !== CompetitionSubmitStatus.IN_PROGRESS) {
            return {
                success: false,
                message: 'Bài thi này đã được nộp hoặc đã kết thúc',
                data: null as any,
            }
        }

        // 2. Lấy toàn bộ câu trả lời của lần làm bài này
        const answers = await this.competitionAnswerRepository.findByCompetitionSubmit(submitId)
        // console.log(`Found ${answers.length} answers for submit ID ${submitId}`)
        // for (const a of answers) {
        //     console.log(`Answer ${a.competitionAnswerId}: questionId=${a.questionId}, points=${a.points}, maxPoints=${a.maxPoints}`)
        // }
        // 3. Tải đề thi để lấy câu hỏi + statements cho việc chấm điểm
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

        // 5. Chấm những câu trả lời chưa được chấm (points === null)
        //    Bỏ qua ESSAY vì phải chấm thủ công
        const gradingUpdates: { id: number; data: { isCorrect: boolean | null; points: number } }[] = []

        for (const answer of answers) {
            // Đã được chấm rồi → bỏ qua
            // if (answer.points !== null && answer.points !== undefined) continue

            const qInfo = questionMap.get(answer.questionId)
            if (!qInfo) continue

            // ESSAY không tự chấm được
            if (qInfo.type === QuestionType.ESSAY) continue

            // Xác định effectiveMaxPoints (bỏ qua giá trị 0 để fallback về DEFAULT_QUESTION_POINTS)
            const _answerMaxPoints = answer.maxPoints != null ? Number(answer.maxPoints) : null
            const _questionOrigin = qInfo.pointsOrigin != null ? Number(qInfo.pointsOrigin) : null
            const effectiveMaxPoints: number | null =
                (_answerMaxPoints != null && _answerMaxPoints > 0)
                    ? _answerMaxPoints
                    : (_questionOrigin != null && _questionOrigin > 0)
                        ? _questionOrigin
                        : (DEFAULT_QUESTION_POINTS[qInfo.type] ?? null)

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
                        // fallback — treat selectedStatementIds as answered
                        answeredStatementIds = answer.selectedStatementIds ?? []
                    }
                } else {
                    // Chưa trả lời → không chấm điểm mệnh đề nào
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
                // Cập nhật in-memory để tính tổng điểm
                answer.points = grade.points
                answer.isCorrect = grade.isCorrect
                gradingUpdates.push({
                    id: answer.competitionAnswerId,
                    data: { isCorrect: grade.isCorrect, points: grade.points },
                })
            }
            // console.log(`Grading answer ID ${answer.competitionAnswerId}: isCorrect=${grade.isCorrect}, points=${grade.points}, effectiveMaxPoints=${effectiveMaxPoints}, answer=${JSON.stringify(answer.answer)}, selectedStatementIds=${JSON.stringify(answer.selectedStatementIds)}, answeredStatementIds=${JSON.stringify(answeredStatementIds)})`)
        }

        // 6. Ghi kết quả chấm vào DB (batch update)
        if (gradingUpdates.length > 0) {
            await this.competitionAnswerRepository.updateMany(gradingUpdates)
        }

        // 7. Tính tổng điểm và điểm tối đa
        const totalPoints = answers.reduce((sum, a) => sum + Number(a.points ?? 0), 0)
        const maxPoints = answers.reduce((sum, a) => sum + Number(a.maxPoints ?? 0), 0)
        // 8. Tính thời gian làm bài
        const now = new Date()
        const timeSpentSeconds = Math.floor((now.getTime() - new Date(submit.startedAt).getTime()) / 1000)

        // 9. Cập nhật submit: SUBMITTED + tổng điểm + thời gian
        const updatedSubmit = await this.competitionSubmitRepository.update(submitId, {
            status: CompetitionSubmitStatus.SUBMITTED,
            submittedAt: now,
            gradedAt: now,
            totalPoints,
            maxPoints,
            timeSpentSeconds,
        })

        console.log(`Submit ID ${submitId} updated: totalPoints=${totalPoints}, maxPoints=${maxPoints}, timeSpentSeconds=${timeSpentSeconds}`)

        // 10. Xử lý HomeworkSubmit nếu có homeworkContentId
        let homeworkSubmitResult: {
            action: 'created' | 'updated' | 'skipped'
            reason?: string
            homeworkSubmitId?: number
            points?: number
        } | null = null

        if (homeworkContentId) {
            const parsedHomeworkContentId = Number(homeworkContentId)
            const homeworkContent = await this.homeworkContentRepository.findById(parsedHomeworkContentId)
            if (!homeworkContent) {
                throw new NotFoundException(`HomeworkContent với ID ${parsedHomeworkContentId} không tồn tại`)
            }

            const now2 = new Date()
            const isPastDue = homeworkContent.isOverdue(now2)
            const existingSubmit = await this.homeworkSubmitRepository.findByHomeworkAndStudent(
                parsedHomeworkContentId,
                studentId,
            )
            // console.log('Existing homework submit:', existingSubmit)

            const newPoints = totalPoints
            const shouldUpdatePoints = (existingPoints: number | null | undefined): boolean => {
                // updateMaxPoints = true  → chỉ cập nhật khi điểm mới CAO HƠN (giữ điểm cao nhất)
                // updateMaxPoints = false → luôn cập nhật bằng điểm mới nhất
                if (homeworkContent.updateMaxPoints) {
                    return newPoints > (existingPoints ?? 0)
                }
                return true
            }


            if (!existingSubmit) {
                // Chưa có submit → tạo mới nếu được phép
                if (isPastDue && !homeworkContent.allowLateSubmit) {
                    homeworkSubmitResult = {
                        action: 'skipped',
                        reason: 'Đã quá hạn nộp bài và không cho phép nộp muộn',
                    }
                } else {
                    const created = await this.homeworkSubmitRepository.create({
                        homeworkContentId: parsedHomeworkContentId,
                        studentId,
                        content: `Nộp bài qua cuộc thi #${competition.competitionId} (submit #${submitId})`,
                        competitionSubmitId: submitId,
                    })
                    // Cập nhật điểm ngay sau khi tạo
                    const updated = await this.homeworkSubmitRepository.update(created.homeworkSubmitId, {
                        points: newPoints,
                    })
                    console.log('Created new homework submit:', newPoints, updated)
                    homeworkSubmitResult = {
                        action: 'created',
                        homeworkSubmitId: updated.homeworkSubmitId,
                        points: newPoints,
                    }
                }
            } else {
                // Đã có submit → kiểm tra có được cập nhật điểm không
                let canUpdate = false
                let skipReason = ''

                if (isPastDue) {
                    if (homeworkContent.allowLateSubmit && homeworkContent.updatePointsOnLateSubmit) {
                        canUpdate = true
                    } else {
                        skipReason = 'Đã quá hạn, không đủ điều kiện cập nhật điểm (allowLateSubmit hoặc updatePointsOnLateSubmit = false)'
                    }
                } else {
                    if (homeworkContent.updatePointsOnReSubmit) {
                        canUpdate = true
                    } else {
                        skipReason = 'Không cho phép cập nhật điểm khi nộp lại'
                    }
                }

                if (canUpdate && shouldUpdatePoints(existingSubmit.points)) {
                    await this.homeworkSubmitRepository.update(existingSubmit.homeworkSubmitId, {
                        points: newPoints,
                        competitionSubmitId: submitId,
                    })
                    homeworkSubmitResult = {
                        action: 'updated',
                        homeworkSubmitId: existingSubmit.homeworkSubmitId,
                        points: newPoints,
                    }
                } else {
                    homeworkSubmitResult = {
                        action: 'skipped',
                        reason: !canUpdate
                            ? skipReason
                            : `Điểm mới (${newPoints}) không cao hơn điểm hiện tại (${existingSubmit.points ?? 0}) và updateMaxPoints = true`,
                    }
                }
            }
        }

        // 11. Trả về kết quả
        const allowViewScore = competition.allowViewScore

        const scorePercentage = maxPoints > 0
            ? Math.round((totalPoints / maxPoints) * 10000) / 100  // round 2 decimal
            : 0

        const allowViewSolutionYoutubeUrl = competition.allowViewSolutionYoutubeUrl

        return BaseResponseDto.success('Nộp bài thành công', {
            competitionSubmitId: submitId,
            competitionId: submit.competitionId,
            attemptNumber: submit.attemptNumber,
            status: updatedSubmit.status,
            startedAt: submit.startedAt,
            submittedAt: updatedSubmit.submittedAt,
            timeSpentSeconds,
            allowViewScore,
            totalPoints: allowViewScore ? totalPoints : null,
            maxPoints: allowViewScore ? maxPoints : null,
            scorePercentage: allowViewScore ? scorePercentage : null,
            solutionYoutubeUrl: allowViewSolutionYoutubeUrl ? (exam.solutionYoutubeUrl ?? null) : null,
            answersGradedOnFinish: gradingUpdates.length,
            homeworkSubmit: homeworkSubmitResult,
        })
    }

    /**
     * Chấm điểm cho một câu trả lời — logic giống submit-competition-answer.use-case.ts
     */
    private gradeAnswer(
        type: QuestionType,
        selectedStatementIds: number[],
        textAnswer: string | undefined,
        question: QuestionGradeInfo,
        effectiveMaxPoints: number | null,
        /** IDs đã có câu trả lời (không null) — chỉ dùng cho TRUE_FALSE;
         *  null = grade tất cả statements */
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
            // Đúng/Sai — chấm theo phần (partial scoring), bỏ qua mệnh đề null
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
            // Trả lời ngắn — chỉ chấp nhận số
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
            // Tự luận và các loại khác — chấm thủ công
            // ─────────────────────────────────────────────────────────────────
            case QuestionType.ESSAY:
            default:
                return { isCorrect: null, points: null }
        }
    }
}
