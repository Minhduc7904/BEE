import { Injectable } from '@nestjs/common'
import { TempQuestion } from '../../../domain/entities/exam-import/temp-question.entity'
import {
  CreateTempQuestionData,
  ITempQuestionRepository,
  UpdateTempQuestionData,
  FindTempQuestionsOptions,
} from '../../../domain/repositories/temp-question.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { TempQuestionMapper } from '../../mappers/exam-import/temp-question.mapper'

@Injectable()
export class PrismaTempQuestionRepository implements ITempQuestionRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateTempQuestionData): Promise<TempQuestion> {
    const created = await this.prisma.tempQuestion.create({
      data: {
        sessionId: data.sessionId,
        tempSectionId: data.tempSectionId,
        content: data.content,
        type: data.type,
        correctAnswer: data.correctAnswer,
        solution: data.solution,
        difficulty: data.difficulty,
        solutionYoutubeUrl: data.solutionYoutubeUrl,
        grade: data.grade,
        subjectId: data.subjectId,
        pointsOrigin: data.pointsOrigin,
        order: data.order,
        metadata: data.metadata,
      },
    })

    return TempQuestionMapper.toDomainTempQuestion(created)!
  }

  async findById(tempQuestionId: number): Promise<TempQuestion | null> {
    const tempQuestion = await this.prisma.tempQuestion.findUnique({
      where: { tempQuestionId },
      include: {
        subject: true,
        tempStatements: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!tempQuestion) return null

    return TempQuestionMapper.toDomainTempQuestion(tempQuestion)!
  }

  async findByIdWithRelations(tempQuestionId: number): Promise<TempQuestion | null> {
    const tempQuestion = await this.prisma.tempQuestion.findUnique({
      where: { tempQuestionId },
      include: {
        subject: true,
        tempStatements: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!tempQuestion) return null

    return TempQuestionMapper.toDomainTempQuestion(tempQuestion)!
  }

  async findBySessionId(sessionId: number): Promise<TempQuestion[]> {
    const tempQuestions = await this.prisma.tempQuestion.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
      include: {
        subject: true,
        tempStatements: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return TempQuestionMapper.toDomainTempQuestions(tempQuestions)
  }

  async findByTempSectionId(tempSectionId: number): Promise<TempQuestion[]> {
    const tempQuestions = await this.prisma.tempQuestion.findMany({
      where: { tempSectionId },
      orderBy: { order: 'asc' },
      include: {
        subject: true,
        tempStatements: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return TempQuestionMapper.toDomainTempQuestions(tempQuestions)
  }

  async findByQuestionId(questionId: number): Promise<TempQuestion | null> {
    const tempQuestion = await this.prisma.tempQuestion.findUnique({
      where: { questionId },
    })

    if (!tempQuestion) return null

    return TempQuestionMapper.toDomainTempQuestion(tempQuestion)!
  }

  async findAll(options?: FindTempQuestionsOptions): Promise<TempQuestion[]> {
    const where: any = {}

    if (options) {
      if (options.sessionId) where.sessionId = options.sessionId
      if (options.tempSectionId) where.tempSectionId = options.tempSectionId
      if (options.subjectId) where.subjectId = options.subjectId
      if (options.type) where.type = options.type
      if (options.difficulty) where.difficulty = options.difficulty
      if (options.grade) where.grade = options.grade
    }

    const tempQuestions = await this.prisma.tempQuestion.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        subject: true,
        tempStatements: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return TempQuestionMapper.toDomainTempQuestions(tempQuestions)
  }

  async update(tempQuestionId: number, data: UpdateTempQuestionData): Promise<TempQuestion> {
    const updated = await this.prisma.tempQuestion.update({
      where: { tempQuestionId },
      data: {
        tempSectionId: data.tempSectionId,
        content: data.content,
        type: data.type,
        correctAnswer: data.correctAnswer,
        solution: data.solution,
        difficulty: data.difficulty,
        solutionYoutubeUrl: data.solutionYoutubeUrl,
        grade: data.grade,
        subjectId: data.subjectId,
        pointsOrigin: data.pointsOrigin,
        order: data.order,
        metadata: data.metadata,
        questionId: data.questionId,
      },
    })
    return TempQuestionMapper.toDomainTempQuestion(updated)!
  }

  async delete(tempQuestionId: number): Promise<void> {
    await this.prisma.tempQuestion.delete({
      where: { tempQuestionId },
    })
  }

  async linkToFinalQuestion(tempQuestionId: number, questionId: number): Promise<TempQuestion> {
    const updated = await this.prisma.tempQuestion.update({
      where: { tempQuestionId },
      data: { questionId },
    })

    return TempQuestionMapper.toDomainTempQuestion(updated)!
  }
}
