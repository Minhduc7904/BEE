// src/infrastructure/repositories/exam/prisma-question-chapter.repository.ts
import { Injectable } from '@nestjs/common'
import { QuestionChapter } from '../../../domain/entities/exam/question-chapter.entity'
import { IQuestionChapterRepository, CreateQuestionChapterData } from '../../../domain/repositories/question-chapter.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { QuestionChapterMapper } from '../../mappers/exam/question-chapter.mapper'

@Injectable()
export class PrismaQuestionChapterRepository implements IQuestionChapterRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateQuestionChapterData, txClient?: any): Promise<QuestionChapter> {
    const client = txClient || this.prisma

    const created = await client.questionChapter.create({
      data: {
        questionId: data.questionId,
        chapterId: data.chapterId,
      },
    })

    return QuestionChapterMapper.toDomainQuestionChapter(created)!
  }

  async createMany(dataArray: CreateQuestionChapterData[], txClient?: any): Promise<number> {
    const client = txClient || this.prisma

    const result = await client.questionChapter.createMany({
      data: dataArray.map(data => ({
        questionId: data.questionId,
        chapterId: data.chapterId,
      })),
      skipDuplicates: true,
    })

    return result.count
  }

  async findByQuestionId(questionId: number, txClient?: any): Promise<QuestionChapter[]> {
    const client = txClient || this.prisma

    const questionChapters = await client.questionChapter.findMany({
      where: { questionId },
    })

    return QuestionChapterMapper.toDomainQuestionChapters(questionChapters)
  }

  async delete(questionId: number, chapterId: number, txClient?: any): Promise<void> {
    const client = txClient || this.prisma

    await client.questionChapter.delete({
      where: {
        questionId_chapterId: {
          questionId,
          chapterId,
        },
      },
    })
  }
}
