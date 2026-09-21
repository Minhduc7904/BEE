import { Injectable } from '@nestjs/common'
import { CompetitionSubmitStatus as PrismaCompetitionSubmitStatus, Prisma } from '@prisma/client'

import {
  ParentCompetitionSubmissionDetail,
  ParentCompetitionSubmissionListItem,
  ParentHomeworkSubmissionDetail,
  ParentHomeworkSubmissionListItem,
  ParentStudentResultPagination,
  ParentStudentResultsReadService,
  ParentStudentSubmissionListResult,
  ParentStudentSubmissionStatistics,
  ParentSubmissionSectionScore,
} from '../../application/interfaces'
import { PrismaService } from '../../prisma/prisma.service'
import { CompetitionSubmitStatus, HomeworkContentType } from '../../shared/enums'

const completedCompetitionStatuses: PrismaCompetitionSubmitStatus[] = [
  PrismaCompetitionSubmitStatus.SUBMITTED,
  PrismaCompetitionSubmitStatus.GRADED,
]

@Injectable()
export class PrismaParentStudentResultsReadService extends ParentStudentResultsReadService {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async isStudentLinked(parentId: number, studentId: number): Promise<boolean> {
    const link = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
      select: { studentId: true },
    })
    return link !== null
  }

  async listHomeworkSubmissions(
    studentId: number,
    pagination: ParentStudentResultPagination,
  ): Promise<ParentStudentSubmissionListResult<ParentHomeworkSubmissionListItem>> {
    const where: Prisma.HomeworkSubmitWhereInput = { studentId }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.homeworkSubmit.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ submitAt: 'desc' }, { homeworkSubmitId: 'desc' }],
        select: {
          homeworkSubmitId: true,
          submitAt: true,
          gradedAt: true,
          points: true,
          feedback: true,
          homeworkContent: {
            select: {
              type: true,
              learningItem: { select: { title: true } },
            },
          },
          competitionSubmit: { select: { totalPoints: true, maxPoints: true } },
        },
      }),
      this.prisma.homeworkSubmit.count({ where }),
    ])

    return {
      data: rows.map((row) => ({
        homeworkSubmitId: row.homeworkSubmitId,
        title: row.homeworkContent.learningItem.title,
        homeworkType: row.homeworkContent.type as HomeworkContentType,
        submittedAt: row.submitAt,
        gradedAt: row.gradedAt,
        points: row.points ?? this.toNumber(row.competitionSubmit?.totalPoints),
        maxPoints: this.homeworkMaxPoints(row.points, row.competitionSubmit?.maxPoints),
        feedback: row.feedback,
      })),
      total,
      page: pagination.page,
      limit: pagination.limit,
    }
  }

  async getHomeworkSubmissionStatistics(studentId: number): Promise<ParentStudentSubmissionStatistics> {
    const [totalSubmissions, scoredRows] = await this.prisma.$transaction([
      this.prisma.homeworkSubmit.count({ where: { studentId } }),
      this.prisma.homeworkSubmit.findMany({
        where: {
          studentId,
          competitionSubmit: { is: { maxPoints: { equals: new Prisma.Decimal(10) } } },
        },
        select: {
          points: true,
          competitionSubmit: { select: { totalPoints: true } },
        },
      }),
    ])
    const scores = scoredRows
      .map((row) => row.points ?? this.toNumber(row.competitionSubmit?.totalPoints))
      .filter((value): value is number => value !== null)

    return {
      totalSubmissions,
      averageScore: scores.length
        ? this.roundScore(scores.reduce((total, value) => total + value, 0) / scores.length)
        : null,
      scoredSubmissions: scores.length,
    }
  }

  async getHomeworkSubmissionDetail(
    studentId: number,
    homeworkSubmitId: number,
  ): Promise<ParentHomeworkSubmissionDetail | null> {
    const row = await this.prisma.homeworkSubmit.findFirst({
      where: { homeworkSubmitId, studentId },
      select: {
        homeworkSubmitId: true,
        studentId: true,
        submitAt: true,
        gradedAt: true,
        points: true,
        feedback: true,
        homeworkContent: { select: { learningItem: { select: { title: true } } } },
        competitionSubmit: { select: this.competitionDetailSelect() },
      },
    })
    if (!row) return null

    return {
      homeworkSubmitId: row.homeworkSubmitId,
      studentId: row.studentId,
      title: row.homeworkContent.learningItem.title,
      submittedAt: row.submitAt,
      gradedAt: row.gradedAt,
      points: row.points ?? this.toNumber(row.competitionSubmit?.totalPoints),
      maxPoints: this.homeworkMaxPoints(row.points, row.competitionSubmit?.maxPoints),
      feedback: row.feedback,
      sectionScores: this.toSectionScores(
        row.competitionSubmit?.competitionAnswers ?? [],
        row.competitionSubmit?.competition.examId,
      ),
    }
  }

  async listStandaloneCompetitionSubmissions(
    studentId: number,
    pagination: ParentStudentResultPagination,
  ): Promise<ParentStudentSubmissionListResult<ParentCompetitionSubmissionListItem>> {
    const where: Prisma.CompetitionSubmitWhereInput = {
      studentId,
      homeworkSubmit: null,
      status: { in: completedCompetitionStatuses },
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.competitionSubmit.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: [{ submittedAt: 'desc' }, { competitionSubmitId: 'desc' }],
        select: {
          competitionSubmitId: true,
          attemptNumber: true,
          status: true,
          submittedAt: true,
          gradedAt: true,
          totalPoints: true,
          maxPoints: true,
          feedback: true,
          competition: { select: { title: true } },
        },
      }),
      this.prisma.competitionSubmit.count({ where }),
    ])

    return {
      data: rows.map((row) => ({
        competitionSubmitId: row.competitionSubmitId,
        title: row.competition.title,
        attemptNumber: row.attemptNumber,
        status: row.status as CompetitionSubmitStatus,
        submittedAt: row.submittedAt,
        gradedAt: row.gradedAt,
        points: this.toNumber(row.totalPoints),
        maxPoints: this.toNumber(row.maxPoints),
        feedback: row.feedback,
      })),
      total,
      page: pagination.page,
      limit: pagination.limit,
    }
  }

  async getStandaloneCompetitionSubmissionStatistics(studentId: number): Promise<ParentStudentSubmissionStatistics> {
    const baseWhere: Prisma.CompetitionSubmitWhereInput = {
      studentId,
      homeworkSubmit: null,
      status: { in: completedCompetitionStatuses },
    }
    const [totalSubmissions, score] = await this.prisma.$transaction([
      this.prisma.competitionSubmit.count({ where: baseWhere }),
      this.prisma.competitionSubmit.aggregate({
        where: {
          ...baseWhere,
          totalPoints: { not: null },
          maxPoints: { equals: new Prisma.Decimal(10) },
        },
        _avg: { totalPoints: true },
        _count: { totalPoints: true },
      }),
    ])

    return {
      totalSubmissions,
      averageScore: this.roundScore(this.toNumber(score._avg.totalPoints)),
      scoredSubmissions: score._count.totalPoints,
    }
  }

  async getStandaloneCompetitionSubmissionDetail(
    studentId: number,
    competitionSubmitId: number,
  ): Promise<ParentCompetitionSubmissionDetail | null> {
    const row = await this.prisma.competitionSubmit.findFirst({
      where: {
        competitionSubmitId,
        studentId,
        homeworkSubmit: null,
        status: { in: completedCompetitionStatuses },
      },
      select: {
        ...this.competitionDetailSelect(),
        studentId: true,
        attemptNumber: true,
        submittedAt: true,
        gradedAt: true,
        feedback: true,
      },
    })
    if (!row) return null

    return {
      competitionSubmitId: row.competitionSubmitId,
      studentId: row.studentId,
      title: row.competition.title,
      attemptNumber: row.attemptNumber,
      submittedAt: row.submittedAt,
      gradedAt: row.gradedAt,
      points: this.toNumber(row.totalPoints),
      maxPoints: this.toNumber(row.maxPoints),
      feedback: row.feedback,
      sectionScores: this.toSectionScores(row.competitionAnswers, row.competition.examId),
    }
  }

  private competitionDetailSelect() {
    return {
      competitionSubmitId: true,
      totalPoints: true,
      maxPoints: true,
      competition: { select: { title: true, examId: true } },
      competitionAnswers: {
        select: {
          points: true,
          maxPoints: true,
          question: {
            select: {
              examQuestions: {
                select: {
                  examId: true,
                  section: { select: { sectionId: true, title: true, order: true } },
                },
              },
            },
          },
        },
      },
    } as const
  }

  private toSectionScores(
    answers: Array<{
      points: Prisma.Decimal | null
      maxPoints: Prisma.Decimal | null
      question: {
        examQuestions: Array<{
          examId: number
          section: { sectionId: number; title: string; order: number } | null
        }>
      }
    }>,
    examId?: number | null,
  ): ParentSubmissionSectionScore[] {
    const grouped = new Map<string, ParentSubmissionSectionScore>()
    for (const answer of answers) {
      const section = answer.question.examQuestions.find((item) => item.examId === examId)?.section ?? null
      const key = section ? String(section.sectionId) : 'unassigned'
      const current = grouped.get(key) ?? {
        sectionId: section?.sectionId ?? null,
        title: section?.title ?? 'Phần chưa phân loại',
        order: section?.order ?? null,
        points: 0,
        maxPoints: 0,
      }
      current.points += this.toNumber(answer.points) ?? 0
      current.maxPoints += this.toNumber(answer.maxPoints) ?? 0
      grouped.set(key, current)
    }

    return [...grouped.values()]
      .map((item) => ({
        ...item,
        points: this.roundScore(item.points) ?? 0,
        maxPoints: this.roundScore(item.maxPoints) ?? 0,
      }))
      .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER))
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
    return value === null || value === undefined ? null : Number(value)
  }

  private homeworkMaxPoints(
    points: number | null,
    competitionMaxPoints: Prisma.Decimal | null | undefined,
  ): number | null {
    if (competitionMaxPoints !== null && competitionMaxPoints !== undefined) {
      return this.toNumber(competitionMaxPoints)
    }
    return points === null ? null : 100
  }

  private roundScore(value: number | null | undefined): number | null {
    return value === null || value === undefined ? null : Math.round(value * 100) / 100
  }
}
