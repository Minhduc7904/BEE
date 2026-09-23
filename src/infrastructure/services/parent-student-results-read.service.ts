import { Injectable } from '@nestjs/common'
import { CompetitionSubmitStatus as PrismaCompetitionSubmitStatus, Prisma } from '@prisma/client'

import {
  encodeResultCursor,
  ParentCompetitionSubmissionDetail,
  ParentCompetitionSubmissionListItem,
  ParentHomeworkSubmissionDetail,
  ParentHomeworkSubmissionListItem,
  ParentStudentResultCursorPagination,
  ParentStudentResultsReadService,
  ParentStudentSubmissionCursorListResult,
  ParentStudentSubmissionStatistics,
  ParentSubmissionSectionScore,
} from '../../application/interfaces'
import { PrismaService } from '../../prisma/prisma.service'

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
    pagination: ParentStudentResultCursorPagination,
  ): Promise<ParentStudentSubmissionCursorListResult<ParentHomeworkSubmissionListItem>> {
    const { after, limit } = pagination
    const where: Prisma.HomeworkSubmitWhereInput = {
      studentId,
      ...(after
        ? {
            OR: [
              { submitAt: { lt: after.timestamp } },
              { submitAt: after.timestamp, homeworkSubmitId: { lt: after.id } },
            ],
          }
        : {}),
    }
    const rows = await this.prisma.homeworkSubmit.findMany({
      where,
      take: limit + 1,
      orderBy: [{ submitAt: 'desc' }, { homeworkSubmitId: 'desc' }],
      select: {
        homeworkSubmitId: true,
        submitAt: true,
        points: true,
        homeworkContent: {
          select: {
            learningItem: { select: { title: true } },
          },
        },
        competitionSubmit: { select: { totalPoints: true, maxPoints: true } },
      },
    })

    const hasNext = rows.length > limit
    const page = hasNext ? rows.slice(0, limit) : rows
    const last = page.at(-1)

    return {
      data: page.map((row) => ({
        homeworkSubmitId: row.homeworkSubmitId,
        title: row.homeworkContent.learningItem.title,
        submittedAt: row.submitAt,
        points: row.points ?? this.toNumber(row.competitionSubmit?.totalPoints),
        maxPoints: row.competitionSubmit
          ? this.toNumber(row.competitionSubmit.maxPoints)
          : this.homeworkMaxPoints(row.points),
      })),
      hasNext,
      nextCursor: hasNext && last ? encodeResultCursor(last.submitAt, last.homeworkSubmitId) : null,
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
        competitionSubmit: {
          select: {
            ...this.competitionDetailSelect(),
            gradedAt: true,
            feedback: true,
          },
        },
      },
    })
    if (!row) return null

    return {
      homeworkSubmitId: row.homeworkSubmitId,
      studentId: row.studentId,
      title: row.homeworkContent.learningItem.title,
      submittedAt: row.submitAt,
      gradedAt: row.competitionSubmit ? row.competitionSubmit.gradedAt : row.gradedAt,
      points: row.competitionSubmit ? this.toNumber(row.competitionSubmit.totalPoints) : row.points,
      maxPoints: row.competitionSubmit
        ? this.toNumber(row.competitionSubmit.maxPoints)
        : this.homeworkMaxPoints(row.points),
      // AI feedback được ghi vào homework_submits.feedback khi bài nộp gắn với BTVN
      // (competition_submits.feedback chỉ được set cho bài thi độc lập) → ưu tiên feedback của homework trước.
      feedback: row.feedback ?? row.competitionSubmit?.feedback ?? null,
      sectionScores: this.toSectionScores(
        row.competitionSubmit?.competitionAnswers ?? [],
        row.competitionSubmit?.competition.examId,
      ),
    }
  }

  async listStandaloneCompetitionSubmissions(
    studentId: number,
    pagination: ParentStudentResultCursorPagination,
  ): Promise<ParentStudentSubmissionCursorListResult<ParentCompetitionSubmissionListItem>> {
    const { after, limit } = pagination
    const where: Prisma.CompetitionSubmitWhereInput = {
      studentId,
      homeworkSubmit: null,
      status: { in: completedCompetitionStatuses },
      ...(after
        ? {
            OR: [
              { submittedAt: { lt: after.timestamp } },
              { submittedAt: after.timestamp, competitionSubmitId: { lt: after.id } },
            ],
          }
        : {}),
    }
    const rows = await this.prisma.competitionSubmit.findMany({
      where,
      take: limit + 1,
      orderBy: [{ submittedAt: 'desc' }, { competitionSubmitId: 'desc' }],
      select: {
        competitionSubmitId: true,
        submittedAt: true,
        totalPoints: true,
        maxPoints: true,
        competition: { select: { title: true } },
      },
    })

    const hasNext = rows.length > limit
    const page = hasNext ? rows.slice(0, limit) : rows
    const last = page.at(-1)

    return {
      data: page.map((row) => ({
        competitionSubmitId: row.competitionSubmitId,
        title: row.competition.title,
        submittedAt: row.submittedAt,
        points: this.toNumber(row.totalPoints),
        maxPoints: this.toNumber(row.maxPoints),
      })),
      hasNext,
      nextCursor: hasNext && last?.submittedAt ? encodeResultCursor(last.submittedAt, last.competitionSubmitId) : null,
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

  private homeworkMaxPoints(points: number | null): number | null {
    return points === null ? null : 100
  }

  private roundScore(value: number | null | undefined): number | null {
    return value === null || value === undefined ? null : Math.round(value * 100) / 100
  }
}
