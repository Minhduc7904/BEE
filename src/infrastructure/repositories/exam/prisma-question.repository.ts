// src/infrastructure/repositories/exam/prisma-question.repository.ts
import { Injectable } from '@nestjs/common'
import { Question } from '../../../domain/entities/exam/question.entity'
import {
    IQuestionRepository,
    CreateQuestionData,
    QuestionFilterOptions,
    QuestionPaginationOptions,
    QuestionListResult,
} from '../../../domain/repositories/question.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { QuestionMapper } from '../../mappers/exam/question.mapper'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

@Injectable()
export class PrismaQuestionRepository implements IQuestionRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    private async generateUniqueSlug(content: string, client: any, reservedSlugs: Set<string> = new Set()): Promise<string> {
        const contentPreview = TextSearchUtil.stripMarkdownForSearch(content).substring(0, 100)
        const baseSlug = TextSearchUtil.generateSlug(contentPreview)

        // Iterate through candidates (baseSlug, baseSlug-2, baseSlug-3, …)
        // and check each one individually against both the DB and the in-batch
        // reserved set. This avoids the count+offset bug where gaps in the slug
        // sequence could produce a candidate that already exists.
        let candidate = baseSlug
        let counter = 2

        while (true) {
            if (!reservedSlugs.has(candidate)) {
                const exists = await client.question.findFirst({
                    where: { slug: candidate },
                    select: { questionId: true },
                })
                if (!exists) return candidate
            }
            candidate = `${baseSlug}-${counter++}`
        }
    }

    async create(data: CreateQuestionData, txClient?: any): Promise<Question> {
        const client = txClient || this.prisma

        const slug = await this.generateUniqueSlug(data.content, client)
        const created = await client.question.create({
            data: {
                content: data.content,
                slug,
                searchableContent: data.searchableContent || TextSearchUtil.stripMarkdownForSearch(data.content),
                type: data.type,
                correctAnswer: data.correctAnswer,
                solution: data.solution,
                difficulty: data.difficulty || null,
                solutionYoutubeUrl: data.solutionYoutubeUrl,
                grade: data.grade || null,
                subjectId: data.subjectId,
                pointsOrigin: data.pointsOrigin,
                visibility: data.visibility,
                createdBy: data.createdBy,
            },
        })

        return QuestionMapper.toDomainQuestion(created)!
    }

    async createMany(dataArray: CreateQuestionData[], txClient?: any): Promise<number> {
        const client = txClient || this.prisma

        // Generate unique slugs sequentially, tracking reserved slugs within the batch
        const reservedSlugs = new Set<string>()
        const dataWithSlugs: any[] = []

        for (const data of dataArray) {
            const slug = await this.generateUniqueSlug(data.content, client, reservedSlugs)
            reservedSlugs.add(slug)
            dataWithSlugs.push({
                content: data.content,
                slug,
                searchableContent: data.searchableContent || TextSearchUtil.stripMarkdownForSearch(data.content),
                type: data.type,
                correctAnswer: data.correctAnswer,
                solution: data.solution,
                difficulty: data.difficulty || null,
                solutionYoutubeUrl: data.solutionYoutubeUrl,
                grade: data.grade || null,
                subjectId: data.subjectId,
                pointsOrigin: data.pointsOrigin,
                visibility: data.visibility,
                createdBy: data.createdBy,
            })
        }

        const result = await client.question.createMany({
            data: dataWithSlugs,
            skipDuplicates: true,
        })

        return result.count
    }

    async findById(id: number, txClient?: any): Promise<Question | null> {
        const client = txClient || this.prisma

        const question = await client.question.findUnique({
            where: { questionId: id },
            include: {
                subject: true,
                admin: {
                    include: {
                        user: true,
                    },
                },
                statements: {
                    orderBy: {
                        order: 'asc',
                    },
                },
                questionChapters: {
                    include: {
                        chapter: true,
                    },
                },
            },
        })

        if (!question) return null

        return QuestionMapper.toDomainQuestion(question)
    }

    async findBySlug(slug: string, txClient?: any): Promise<Question | null> {
        const client = txClient || this.prisma

        const question = await client.question.findUnique({
            where: { slug },
            include: {
                subject: true,
                admin: {
                    include: {
                        user: true,
                    },
                },
                statements: {
                    orderBy: {
                        order: 'asc',
                    },
                },
                questionChapters: {
                    include: {
                        chapter: true,
                    },
                },
            },
        })

        if (!question) return null

        return QuestionMapper.toDomainQuestion(question)
    }

    async findByIds(ids: number[], txClient?: any): Promise<Question[]> {
        const client = txClient || this.prisma

        const questions = await client.question.findMany({
            where: {
                questionId: { in: ids },
            },
        })

        return QuestionMapper.toDomainQuestions(questions)
    }

    async update(id: number, data: Partial<CreateQuestionData>, txClient?: any): Promise<Question> {
        const client = txClient || this.prisma

        const updateData: any = {}
        
        if (data.content !== undefined) {
            updateData.content = data.content
            // Auto-update searchableContent and slug when content changes
            updateData.searchableContent = TextSearchUtil.stripMarkdownForSearch(data.content)
            updateData.slug = await this.generateUniqueSlug(data.content, client)
        }
        if (data.searchableContent !== undefined) updateData.searchableContent = data.searchableContent
        if (data.type !== undefined) updateData.type = data.type
        if (data.correctAnswer !== undefined) updateData.correctAnswer = data.correctAnswer
        if (data.solution !== undefined) updateData.solution = data.solution
        if (data.difficulty !== undefined) updateData.difficulty = data.difficulty
        if (data.solutionYoutubeUrl !== undefined) updateData.solutionYoutubeUrl = data.solutionYoutubeUrl
        if (data.grade !== undefined) updateData.grade = data.grade
        if (data.subjectId !== undefined) updateData.subjectId = data.subjectId
        if (data.pointsOrigin !== undefined) updateData.pointsOrigin = data.pointsOrigin
        if (data.visibility !== undefined) updateData.visibility = data.visibility

        const updated = await client.question.update({
            where: { questionId: id },
            data: updateData,
        })

        return QuestionMapper.toDomainQuestion(updated)!
    }

    async delete(id: number, txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.question.delete({
            where: { questionId: id },
        })
    }

    async findAllWithPagination(
        pagination: QuestionPaginationOptions,
        filters?: QuestionFilterOptions,
        txClient?: any,
    ): Promise<QuestionListResult> {
        const client = txClient || this.prisma

        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const sortBy = pagination.sortBy || 'createdAt'
        const sortOrder = pagination.sortOrder || 'desc'
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (filters?.search) {
            // Use improved search with TextSearchUtil
            where.OR = [
                // Priority 1: Search in searchableContent (stripped markdown)
                { searchableContent: { contains: TextSearchUtil.stripMarkdownForSearch(filters.search) } },
                // Priority 2: Search in original content
                { content: { contains: filters.search } },
                // Priority 3: Search in answer
                { correctAnswer: { contains: filters.search } },
                // Priority 4: Search in solution
                { solution: { contains: TextSearchUtil.stripMarkdownForSearch(filters.search) } },
                // Priority 5: Search in statements
                {
                    statements: {
                        some: {
                            content: { contains: filters.search }
                        }
                    }
                }
            ]
        }

        if (filters?.subjectId !== undefined) {
            where.subjectId = filters.subjectId
        }

        if (filters?.type) {
            where.type = filters.type
        }

        if (filters?.difficulty) {
            where.difficulty = filters.difficulty
        }

        if (filters?.grade !== undefined) {
            where.grade = filters.grade
        }

        if (filters?.visibility) {
            where.visibility = filters.visibility
        }

        if (filters?.createdBy !== undefined) {
            where.createdBy = filters.createdBy
        }

        if (filters?.chapterIds !== undefined && filters.chapterIds.length > 0) {
            where.questionChapters = {
                some: {
                    chapterId: {
                        in: filters.chapterIds,
                    },
                },
            }
        }

        if (filters?.examId !== undefined) {
            where.examQuestions = {
                some: {
                    examId: filters.examId,
                },
            }
        }

        if (filters?.excludeQuestionIds !== undefined && filters.excludeQuestionIds.length > 0) {
            where.questionId = {
                notIn: filters.excludeQuestionIds,
            }
        }

        // Build orderBy
        let orderBy: any
        
        // If filtering by examId, sort by QuestionExam.order
        if (filters?.examId !== undefined) {
            orderBy = {
                examQuestions: {
                    _count: 'desc',  // This ensures questions in exam come first
                },
            }
        } else {
            orderBy = {}
            orderBy[sortBy] = sortOrder
        }

        const [prismaQuestions, total] = await Promise.all([
            client.question.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    subject: true,
                    admin: {
                        include: {
                            user: true,
                        },
                    },
                    statements: {
                        orderBy: {
                            order: 'asc',
                        },
                    },
                    questionChapters: {
                        include: {
                            chapter: true,
                        },
                    },
                    examQuestions: filters?.examId !== undefined ? {
                        where: {
                            examId: filters.examId,
                        },
                        orderBy: {
                            order: 'asc',
                        },
                    } : false,
                },
            }),
            client.question.count({ where }),
        ])

        // Sort questions by examQuestions.order if filtering by exam
        let questions = QuestionMapper.toDomainQuestions(prismaQuestions)
        
        if (filters?.examId !== undefined) {
            // Sort by order from QuestionExam table
            questions = questions.sort((a, b) => {
                const orderA = a.examQuestions?.[0]?.order ?? Number.MAX_SAFE_INTEGER
                const orderB = b.examQuestions?.[0]?.order ?? Number.MAX_SAFE_INTEGER
                return orderA - orderB
            })
        }

        const totalPages = Math.ceil(total / limit)

        return {
            questions,
            total,
            page,
            limit,
            totalPages,
        }
    }
}
