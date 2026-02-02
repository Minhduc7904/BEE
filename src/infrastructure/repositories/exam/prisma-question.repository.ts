// src/infrastructure/repositories/exam/prisma-question.repository.ts
import { Injectable } from '@nestjs/common'
import { Question } from '../../../domain/entities/exam/question.entity'
import { IQuestionRepository, CreateQuestionData } from '../../../domain/repositories/question.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { QuestionMapper } from '../../mappers/exam/question.mapper'

@Injectable()
export class PrismaQuestionRepository implements IQuestionRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateQuestionData, txClient?: any): Promise<Question> {
        const client = txClient || this.prisma

        const created = await client.question.create({
            data: {
                content: data.content,
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

        const result = await client.question.createMany({
            data: dataArray.map(data => ({
                content: data.content,
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
            })),
            skipDuplicates: true,
        })

        return result.count
    }

    async findById(id: number, txClient?: any): Promise<Question | null> {
        const client = txClient || this.prisma

        const question = await client.question.findUnique({
            where: { questionId: id },
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

        const updated = await client.question.update({
            where: { questionId: id },
            data: {
                ...(data.content && { content: data.content }),
                ...(data.type && { type: data.type }),
                ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
                ...(data.solution !== undefined && { solution: data.solution }),
                ...(data.difficulty && { difficulty: data.difficulty }),
                ...(data.solutionYoutubeUrl !== undefined && { solutionYoutubeUrl: data.solutionYoutubeUrl }),
                ...(data.grade && { grade: data.grade }),
                ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
                ...(data.pointsOrigin !== undefined && { pointsOrigin: data.pointsOrigin }),
                ...(data.visibility && { visibility: data.visibility }),
            },
        })

        return QuestionMapper.toDomainQuestion(updated)!
    }

    async delete(id: number, txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.question.delete({
            where: { questionId: id },
        })
    }
}
