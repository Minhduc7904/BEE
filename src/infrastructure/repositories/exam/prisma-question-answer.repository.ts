import { Injectable } from '@nestjs/common'
import { Difficulty } from '../../../shared/enums'
import { QuestionAnswer } from '../../../domain/entities/exam/question-answer.entity'
import {
    CreateQuestionAnswerData,
    IQuestionAnswerRepository,
    QuestionAnswerListResult,
    QuestionAnswerPaginationOptions,
    StudentQuestionAnswerChapterStat,
    StudentQuestionAnswerDailyStat,
    StudentQuestionAnswerDifficultyStat,
    UpdateQuestionAnswerData,
    StudentQuestionAnswerFilterOptions,
    StudentDifficultyProgressStat,
    StudentQuestionAnswerStatisticsFilterOptions,
    StudentQuestionAnswerStatisticsResult,
} from '../../../domain/repositories/question-answer.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { QuestionAnswerMapper } from '../../mappers/exam/question-answer.mapper'
import { ExamVisibility } from '../../../shared/enums/exam-visibility.enum'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'

@Injectable()
export class PrismaQuestionAnswerRepository implements IQuestionAnswerRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async getPublicStudentStatistics(
        studentId: number,
        filters?: StudentQuestionAnswerStatisticsFilterOptions,
        txClient?: any,
    ): Promise<StudentQuestionAnswerStatisticsResult> {
        const client = txClient || this.prisma

        const dateConditions: string[] = []
        const dateParams: Array<string | number> = [studentId]

        if (filters?.fromDate) {
            dateConditions.push('AND DATE(DATE_ADD(ea.started_at, INTERVAL 7 HOUR)) >= ?')
            dateParams.push(filters.fromDate)
        }

        if (filters?.toDate) {
            dateConditions.push('AND DATE(DATE_ADD(ea.started_at, INTERVAL 7 HOUR)) <= ?')
            dateParams.push(filters.toDate)
        }

        const dateWhereSql = dateConditions.length > 0 ? `\n        ${dateConditions.join('\n        ')}` : ''

        const chapterRows = await client.$queryRawUnsafe(
            `
            SELECT
              c.chapter_id AS chapterId,
              c.name AS chapterName,
                            COALESCE(ct.totalQuestionsInChapter, 0) AS totalQuestionsInChapter,
              COUNT(qa.question_answer_id) AS answeredCount,
              SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correctCount,
              SUM(CASE WHEN qa.is_correct = 0 THEN 1 ELSE 0 END) AS incorrectCount
            FROM question_answers qa
            INNER JOIN exam_attempts ea ON ea.attempt_id = qa.attempt_id
            INNER JOIN exams e ON e.exam_id = ea.exam_id
            INNER JOIN questions q ON q.question_id = qa.question_id
            LEFT JOIN questions_chapters qc ON qc.question_id = q.question_id
            LEFT JOIN chapters c ON c.chapter_id = qc.chapter_id
                        LEFT JOIN (
                            SELECT
                                qc2.chapter_id AS chapterId,
                                COUNT(DISTINCT qc2.question_id) AS totalQuestionsInChapter
                            FROM questions_chapters qc2
                            INNER JOIN questions_exams qe2 ON qe2.question_id = qc2.question_id
                            INNER JOIN exams e2 ON e2.exam_id = qe2.exam_id
                            WHERE e2.visibility = 'PUBLISHED'
                            GROUP BY qc2.chapter_id
                        ) ct ON ct.chapterId = c.chapter_id
            WHERE ea.student_id = ?
              AND e.visibility = 'PUBLISHED'${dateWhereSql}
                        GROUP BY c.chapter_id, c.name, ct.totalQuestionsInChapter
            ORDER BY answeredCount DESC, c.chapter_id ASC
            `,
            ...dateParams,
        ) as Array<{
            chapterId: number | null
            chapterName: string | null
                        totalQuestionsInChapter: number | bigint | null
            answeredCount: number | bigint
            correctCount: number | bigint | null
            incorrectCount: number | bigint | null
        }>

        const difficultyRows = await client.$queryRawUnsafe(
            `
            SELECT
              q.difficulty AS difficulty,
              COUNT(qa.question_answer_id) AS answeredCount,
              SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correctCount,
              SUM(CASE WHEN qa.is_correct = 0 THEN 1 ELSE 0 END) AS incorrectCount
            FROM question_answers qa
            INNER JOIN exam_attempts ea ON ea.attempt_id = qa.attempt_id
            INNER JOIN exams e ON e.exam_id = ea.exam_id
            INNER JOIN questions q ON q.question_id = qa.question_id
            WHERE ea.student_id = ?
              AND e.visibility = 'PUBLISHED'${dateWhereSql}
            GROUP BY q.difficulty
            ORDER BY answeredCount DESC
            `,
            ...dateParams,
        ) as Array<{
            difficulty: Difficulty | null
            answeredCount: number | bigint
            correctCount: number | bigint | null
            incorrectCount: number | bigint | null
        }>

        const dailyRows = await client.$queryRawUnsafe(
            `
            SELECT
              DATE(DATE_ADD(ea.started_at, INTERVAL 7 HOUR)) AS date,
              COUNT(qa.question_answer_id) AS answeredCount
            FROM question_answers qa
            INNER JOIN exam_attempts ea ON ea.attempt_id = qa.attempt_id
            INNER JOIN exams e ON e.exam_id = ea.exam_id
            WHERE ea.student_id = ?
              AND e.visibility = 'PUBLISHED'${dateWhereSql}
            GROUP BY DATE(DATE_ADD(ea.started_at, INTERVAL 7 HOUR))
            ORDER BY DATE(DATE_ADD(ea.started_at, INTERVAL 7 HOUR)) ASC
            `,
            ...dateParams,
        ) as Array<{
            date: string | Date
            answeredCount: number | bigint
        }>

        const byChapter: StudentQuestionAnswerChapterStat[] = chapterRows.map((row) => ({
            chapterId: row.chapterId != null ? Number(row.chapterId) : null,
            chapterName: row.chapterName || 'Không có chapter',
            totalQuestionsInChapter: typeof row.totalQuestionsInChapter === 'bigint'
                ? Number(row.totalQuestionsInChapter)
                : Number(row.totalQuestionsInChapter || 0),
            answeredCount: typeof row.answeredCount === 'bigint' ? Number(row.answeredCount) : Number(row.answeredCount || 0),
            correctCount: typeof row.correctCount === 'bigint' ? Number(row.correctCount) : Number(row.correctCount || 0),
            incorrectCount: typeof row.incorrectCount === 'bigint' ? Number(row.incorrectCount) : Number(row.incorrectCount || 0),
        }))

        const byDifficulty: StudentQuestionAnswerDifficultyStat[] = difficultyRows.map((row) => ({
            difficulty: row.difficulty,
            answeredCount: typeof row.answeredCount === 'bigint' ? Number(row.answeredCount) : Number(row.answeredCount || 0),
            correctCount: typeof row.correctCount === 'bigint' ? Number(row.correctCount) : Number(row.correctCount || 0),
            incorrectCount: typeof row.incorrectCount === 'bigint' ? Number(row.incorrectCount) : Number(row.incorrectCount || 0),
        }))

        const byDay: StudentQuestionAnswerDailyStat[] = dailyRows.map((row) => ({
            date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
            answeredCount: typeof row.answeredCount === 'bigint' ? Number(row.answeredCount) : Number(row.answeredCount || 0),
        }))

        return {
            byChapter,
            byDifficulty,
            byDay,
        }
    }

    async findPublicByStudentAndAttempt(
        studentId: number,
        attemptId: number,
        txClient?: any,
    ): Promise<QuestionAnswer[]> {
        const client = txClient || this.prisma

        const answers = await client.questionAnswer.findMany({
            where: {
                attemptId,
                examAttempt: {
                    studentId,
                    exam: {
                        visibility: ExamVisibility.PUBLISHED,
                    },
                },
            },
            include: {
                question: {
                    include: {
                        statements: true,
                    },
                },
                examAttempt: {
                    include: {
                        exam: true,
                    },
                },
            },
            orderBy: {
                questionAnswerId: 'asc',
            },
        })

        return QuestionAnswerMapper.toDomainQuestionAnswers(answers)
    }

    async findByAttemptAndQuestion(
        attemptId: number | null,
        questionId: number,
        txClient?: any,
    ) {
        const client = txClient || this.prisma

        const answer = await client.questionAnswer.findFirst({
            where: {
                attemptId,
                questionId,
            },
            include: {
                question: {
                    include: {
                        statements: true,
                    },
                },
                examAttempt: {
                    include: {
                        exam: true,
                    },
                },
            },
            orderBy: {
                questionAnswerId: 'asc',
            },
        })

        return QuestionAnswerMapper.toDomainQuestionAnswer(answer)
    }

    async create(data: CreateQuestionAnswerData, txClient?: any) {
        const client = txClient || this.prisma

        const created = await client.questionAnswer.create({
            data: {
                attemptId: data.attemptId ?? null,
                questionId: data.questionId,
                answer: data.answer ?? null,
                selectedStatementIds: data.selectedStatementIds ?? null,
                isCorrect: data.isCorrect ?? null,
                points: data.points ?? null,
                maxPoints: data.maxPoints ?? null,
                timeSpentSeconds: data.timeSpentSeconds ?? null,
            },
            include: {
                question: {
                    include: {
                        statements: true,
                    },
                },
                examAttempt: {
                    include: {
                        exam: true,
                    },
                },
            },
        })

        return QuestionAnswerMapper.toDomainQuestionAnswer(created)!
    }

    async update(questionAnswerId: number, data: UpdateQuestionAnswerData, txClient?: any) {
        const client = txClient || this.prisma

        const updated = await client.questionAnswer.update({
            where: {
                questionAnswerId,
            },
            data: {
                ...(data.answer !== undefined ? { answer: data.answer } : {}),
                ...(data.selectedStatementIds !== undefined
                    ? { selectedStatementIds: data.selectedStatementIds ?? null }
                    : {}),
                ...(data.isCorrect !== undefined ? { isCorrect: data.isCorrect } : {}),
                ...(data.points !== undefined ? { points: data.points } : {}),
                ...(data.maxPoints !== undefined ? { maxPoints: data.maxPoints } : {}),
                ...(data.timeSpentSeconds !== undefined
                    ? { timeSpentSeconds: data.timeSpentSeconds }
                    : {}),
            },
            include: {
                question: {
                    include: {
                        statements: true,
                    },
                },
                examAttempt: {
                    include: {
                        exam: true,
                    },
                },
            },
        })

        return QuestionAnswerMapper.toDomainQuestionAnswer(updated)!
    }

    async calculateAttemptTotals(attemptId: number, txClient?: any): Promise<{ totalPoints: number; maxPoints: number }> {
        const client = txClient || this.prisma

        const [totalPointsAgg, maxPointsAgg] = await Promise.all([
            client.questionAnswer.aggregate({
                where: {
                    attemptId,
                },
                _sum: {
                    points: true,
                },
            }),
            client.questionAnswer.aggregate({
                where: {
                    attemptId,
                },
                _sum: {
                    maxPoints: true,
                },
            }),
        ])

        return {
            totalPoints: Number(totalPointsAgg._sum.points ?? 0),
            maxPoints: Number(maxPointsAgg._sum.maxPoints ?? 0),
        }
    }

    async findPublicByStudentWithPagination(
        studentId: number,
        pagination: QuestionAnswerPaginationOptions,
        filters?: StudentQuestionAnswerFilterOptions,
        txClient?: any,
    ): Promise<QuestionAnswerListResult> {
        const client = txClient || this.prisma

        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'questionAnswerId'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        const submittedAttemptWhere: any = {
            studentId,
            status: ExamAttemptStatus.SUBMITTED,
            exam: {
                visibility: ExamVisibility.PUBLISHED,
            },
        }

        if (filters?.attemptId !== undefined) {
            submittedAttemptWhere.attemptId = filters.attemptId
        }

        if (filters?.examId !== undefined) {
            submittedAttemptWhere.examId = filters.examId
        }

        const where: any = {
            questionId: filters?.questionId,
            OR: filters?.attemptId !== undefined
                ? [
                    {
                        examAttempt: submittedAttemptWhere,
                    },
                ]
                : [
                    {
                        attemptId: null,
                    },
                    {
                        examAttempt: submittedAttemptWhere,
                    },
                ],
        }

        const allowedSortFields = new Set(['questionAnswerId', 'questionId', 'timeSpentSeconds', 'points', 'maxPoints'])
        const [prismaAnswers, total] = await Promise.all([
            client.questionAnswer.findMany({
                where,
                skip,
                take: limit,
                orderBy: allowedSortFields.has(sortBy)
                    ? { [sortBy]: sortOrder }
                    : { questionAnswerId: 'desc' },
                include: {
                    question: {
                        include: {
                            statements: true,
                        },
                    },
                    examAttempt: {
                        include: {
                            exam: true,
                        },
                    },
                },
            }),
            client.questionAnswer.count({ where }),
        ])

        const questionAnswers = QuestionAnswerMapper.toDomainQuestionAnswers(prismaAnswers)
        const totalPages = Math.ceil(total / limit)

        return {
            questionAnswers,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async getStudentDifficultyProgress(
        studentId: number,
        grade?: number,
        txClient?: any,
    ): Promise<StudentDifficultyProgressStat[]> {
        const client = txClient || this.prisma

        const questionWhere: any = {
            difficulty: {
                not: null,
            },
        }

        if (grade !== undefined) {
            questionWhere.grade = grade
        }

        const [totalByDifficulty, doneDistinctAnswers] = await Promise.all([
            client.question.groupBy({
                by: ['difficulty'],
                where: questionWhere,
                _count: {
                    _all: true,
                },
            }),
            client.questionAnswer.findMany({
                where: {
                    examAttempt: {
                        studentId,
                    },
                    question: questionWhere,
                },
                distinct: ['questionId'],
                select: {
                    questionId: true,
                    question: {
                        select: {
                            difficulty: true,
                        },
                    },
                },
            }),
        ])

        const totalMap = new Map<Difficulty, number>()
        for (const item of totalByDifficulty) {
            const difficulty = item.difficulty as Difficulty | null
            if (!difficulty) continue
            totalMap.set(difficulty, item._count._all)
        }

        const doneMap = new Map<Difficulty, number>()
        for (const item of doneDistinctAnswers) {
            const difficulty = item.question?.difficulty as Difficulty | null
            if (!difficulty) continue
            doneMap.set(difficulty, (doneMap.get(difficulty) || 0) + 1)
        }

        return Object.values(Difficulty).map((difficulty) => ({
            difficulty,
            doneCount: doneMap.get(difficulty) || 0,
            totalCount: totalMap.get(difficulty) || 0,
        }))
    }
}
