import { Injectable } from '@nestjs/common'
import { Difficulty } from '../../../shared/enums'
import {
    IQuestionAnswerRepository,
    QuestionAnswerListResult,
    QuestionAnswerPaginationOptions,
    StudentQuestionAnswerFilterOptions,
    StudentDifficultyProgressStat,
} from '../../../domain/repositories/question-answer.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { QuestionAnswerMapper } from '../../mappers/exam/question-answer.mapper'
import { ExamVisibility } from '../../../shared/enums/exam-visibility.enum'

@Injectable()
export class PrismaQuestionAnswerRepository implements IQuestionAnswerRepository {
    constructor(private readonly prisma: PrismaService | any) { }

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

        const where: any = {
            questionId: filters?.questionId,
            examAttempt: {
                studentId,
                attemptId: filters?.attemptId,
                examId: filters?.examId,
                exam: {
                    visibility: ExamVisibility.PUBLISHED,
                },
            },
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
                    question: true,
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
