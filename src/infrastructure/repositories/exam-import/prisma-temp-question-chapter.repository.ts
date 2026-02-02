// src/infrastructure/repositories/exam-import/prisma-temp-question-chapter.repository.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import {
    ITempQuestionChapterRepository,
    CreateTempQuestionChapterData,
} from '../../../domain/repositories/temp-question-chapter.repository'
import { TempQuestionChapter } from '../../../domain/entities/exam-import/temp-question-chapter.entity'
import { TempQuestionChapterMapper } from '../../mappers/exam-import/temp-question-chapter.mapper'

@Injectable()
export class PrismaTempQuestionChapterRepository implements ITempQuestionChapterRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateTempQuestionChapterData): Promise<TempQuestionChapter> {
        const record = await this.prisma.tempQuestionChapter.create({
            data: {
                tempQuestionId: data.tempQuestionId,
                chapterId: data.chapterId,
            },
            include: {
                tempQuestion: true,
                chapter: true,
            },
        })

        const domain = TempQuestionChapterMapper.toDomainTempQuestionChapter(record)
        if (!domain) {
            throw new Error('Failed to map TempQuestionChapter to domain entity')
        }
        return domain
    }

    async createMany(data: CreateTempQuestionChapterData[]): Promise<number> {
        if (data.length === 0) return 0

        const result = await this.prisma.tempQuestionChapter.createMany({
            data: data.map((item) => ({
                tempQuestionId: item.tempQuestionId,
                chapterId: item.chapterId,
            })),
            skipDuplicates: true, // Skip nếu đã tồn tại
        })

        return result.count
    }

    async findByTempQuestionId(tempQuestionId: number): Promise<TempQuestionChapter[]> {
        const records = await this.prisma.tempQuestionChapter.findMany({
            where: { tempQuestionId },
            include: {
                tempQuestion: true,
                chapter: true,
            },
            orderBy: {
                chapter: {
                    orderInParent: 'asc',
                },
            },
        })

        return TempQuestionChapterMapper.toDomainTempQuestionChapters(records)
    }

    async deleteByTempQuestionId(tempQuestionId: number): Promise<number> {
        const result = await this.prisma.tempQuestionChapter.deleteMany({
            where: { tempQuestionId },
        })

        return result.count
    }

    async delete(tempQuestionId: number, chapterId: number): Promise<boolean> {
        try {
            await this.prisma.tempQuestionChapter.delete({
                where: {
                    tempQuestionId_chapterId: {
                        tempQuestionId,
                        chapterId,
                    },
                },
            })
            return true
        } catch {
            return false
        }
    }
}
