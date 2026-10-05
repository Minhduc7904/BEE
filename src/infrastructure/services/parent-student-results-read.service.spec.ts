import { Prisma } from '@prisma/client'

import { PrismaParentStudentResultsReadService } from './parent-student-results-read.service'
import { decodeResultCursor, encodeResultCursor } from '../../application/interfaces/parent-result-cursor.interface'
import type { PrismaService } from '../../prisma/prisma.service'

describe('encodeResultCursor / decodeResultCursor', () => {
  it('round-trip đúng timestamp và id', () => {
    const timestamp = new Date('2026-09-20T10:00:00.000Z')
    const cursor = encodeResultCursor(timestamp, 42)
    expect(cursor).toBe(`${timestamp.getTime()}_42`)
    expect(decodeResultCursor(cursor)).toEqual({ timestamp, id: 42 })
  })

  it('trả null với chuỗi sai định dạng', () => {
    expect(decodeResultCursor('not-a-cursor')).toBeNull()
    expect(decodeResultCursor('123')).toBeNull()
    expect(decodeResultCursor('abc_1')).toBeNull()
  })
})

describe('PrismaParentStudentResultsReadService', () => {
  it('listHomeworkSubmissions: hasNext=false và nextCursor=null khi số bản ghi vừa đúng limit', async () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({
      homeworkSubmitId: 10 - index,
      submitAt: new Date(2026, 8, 20 - index),
      gradedAt: null,
      points: 8,
      feedback: null,
      homeworkContent: { type: 'FILE_UPLOAD', learningItem: { title: `Bài ${index}` } },
      competitionSubmit: null,
    }))
    const prisma = {
      homeworkSubmit: { findMany: jest.fn().mockResolvedValue(rows) },
    } as unknown as PrismaService
    const service = new PrismaParentStudentResultsReadService(prisma)

    const result = await service.listHomeworkSubmissions(12, { after: null, limit: 10 })

    expect(result.data).toHaveLength(10)
    expect(result.hasNext).toBe(false)
    expect(result.nextCursor).toBeNull()
    expect(Object.keys(result.data[0]).sort()).toEqual([
      'homeworkSubmitId',
      'maxPoints',
      'points',
      'submittedAt',
      'title',
    ])
    expect(prisma.homeworkSubmit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: 12 },
        take: 11,
        select: {
          homeworkSubmitId: true,
          submitAt: true,
          points: true,
          homeworkContent: { select: { learningItem: { select: { title: true } } } },
          competitionSubmit: { select: { totalPoints: true, maxPoints: true } },
        },
      }),
    )
  })

  it('listHomeworkSubmissions: hasNext=true và nextCursor lấy từ bản ghi cuối trang khi thừa 1 bản ghi', async () => {
    const rows = Array.from({ length: 11 }, (_, index) => ({
      homeworkSubmitId: 20 - index,
      submitAt: new Date(2026, 8, 20 - index),
      gradedAt: null,
      points: 5,
      feedback: null,
      homeworkContent: { type: 'FILE_UPLOAD', learningItem: { title: `Bài ${index}` } },
      competitionSubmit: null,
    }))
    const prisma = {
      homeworkSubmit: { findMany: jest.fn().mockResolvedValue(rows) },
    } as unknown as PrismaService
    const service = new PrismaParentStudentResultsReadService(prisma)

    const result = await service.listHomeworkSubmissions(12, { after: null, limit: 10 })

    expect(result.data).toHaveLength(10)
    expect(result.hasNext).toBe(true)
    const lastRow = rows[9]
    expect(result.nextCursor).toBe(encodeResultCursor(lastRow.submitAt, lastRow.homeworkSubmitId))
  })

  it('listHomeworkSubmissions: truyền cursor thì lọc theo (submitAt, id) nhỏ hơn cursor', async () => {
    const prisma = {
      homeworkSubmit: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService
    const service = new PrismaParentStudentResultsReadService(prisma)
    const after = { timestamp: new Date('2026-09-18T00:00:00.000Z'), id: 7 }

    await service.listHomeworkSubmissions(12, { after, limit: 10 })

    expect(prisma.homeworkSubmit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          studentId: 12,
          OR: [
            { submitAt: { lt: after.timestamp } },
            { submitAt: after.timestamp, homeworkSubmitId: { lt: after.id } },
          ],
        },
      }),
    )
  })

  it('listStandaloneCompetitionSubmissions: giữ nguyên filter loại trừ homework-linked và cursor theo submittedAt', async () => {
    const prisma = {
      competitionSubmit: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService
    const service = new PrismaParentStudentResultsReadService(prisma)
    const after = { timestamp: new Date('2026-09-18T00:00:00.000Z'), id: 3 }

    await service.listStandaloneCompetitionSubmissions(12, { after, limit: 10 })

    expect(prisma.competitionSubmit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 12,
          homeworkSubmit: null,
          status: { in: ['SUBMITTED', 'GRADED'] },
          OR: [
            { submittedAt: { lt: after.timestamp } },
            { submittedAt: after.timestamp, competitionSubmitId: { lt: after.id } },
          ],
        }),
        select: {
          competitionSubmitId: true,
          submittedAt: true,
          totalPoints: true,
          maxPoints: true,
          competition: { select: { title: true } },
        },
      }),
    )
  })

  it('homework detail liên kết dùng điểm competition nhưng ưu tiên nhận xét homework', async () => {
    const homeworkDate = new Date('2026-09-20T10:00:00Z')
    const competitionGradedAt = new Date('2026-09-21T10:00:00Z')
    const row = {
      homeworkSubmitId: 12,
      studentId: 9,
      submitAt: homeworkDate,
      gradedAt: null,
      points: 5,
      feedback: 'Nhận xét bài tập',
      homeworkContent: { learningItem: { title: 'Bài tập Toán' } },
      competitionSubmit: {
        competitionSubmitId: 22,
        totalPoints: new Prisma.Decimal(8),
        maxPoints: new Prisma.Decimal(10),
        gradedAt: competitionGradedAt,
        feedback: 'Nhận xét bài thi',
        competition: { title: 'Cuộc thi', examId: 1 },
        competitionAnswers: [],
      },
    }
    const prisma = { homeworkSubmit: { findFirst: jest.fn().mockResolvedValue(row) } } as unknown as PrismaService
    const detail = await new PrismaParentStudentResultsReadService(prisma).getHomeworkSubmissionDetail(9, 12)
    expect(detail).toMatchObject({
      homeworkSubmitId: 12,
      title: 'Bài tập Toán',
      submittedAt: homeworkDate,
      gradedAt: competitionGradedAt,
      points: 8,
      maxPoints: 10,
      feedback: 'Nhận xét bài tập',
      sectionScores: [],
    })
  })

  it('homework detail không liên kết giữ điểm và nhận xét homework', async () => {
    const row = {
      homeworkSubmitId: 12,
      studentId: 9,
      submitAt: new Date('2026-09-20T10:00:00Z'),
      gradedAt: null,
      points: 7,
      feedback: 'Nhận xét bài tập',
      homeworkContent: { learningItem: { title: 'Bài tập Toán' } },
      competitionSubmit: null,
    }
    const prisma = { homeworkSubmit: { findFirst: jest.fn().mockResolvedValue(row) } } as unknown as PrismaService
    const detail = await new PrismaParentStudentResultsReadService(prisma).getHomeworkSubmissionDetail(9, 12)
    expect(detail).toMatchObject({ points: 7, maxPoints: 100, feedback: 'Nhận xét bài tập', sectionScores: [] })
  })

  it('tính điểm homework tổng 10 từ cả homework points và competition fallback', async () => {
    const prisma = {
      homeworkSubmit: {
        count: jest.fn().mockResolvedValue(4),
        findMany: jest.fn().mockResolvedValue([
          { points: 8, competitionSubmit: { totalPoints: new Prisma.Decimal(7) } },
          { points: null, competitionSubmit: { totalPoints: new Prisma.Decimal(9) } },
          { points: null, competitionSubmit: { totalPoints: null } },
        ]),
      },
      $transaction: jest.fn((operations: Array<Promise<unknown>>) => Promise.all(operations)),
    } as unknown as PrismaService
    const service = new PrismaParentStudentResultsReadService(prisma)

    await expect(service.getHomeworkSubmissionStatistics(12)).resolves.toEqual({
      totalSubmissions: 4,
      averageScore: 8.5,
      scoredSubmissions: 2,
    })
    expect(prisma.homeworkSubmit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 12,
          competitionSubmit: {
            is: { maxPoints: { equals: new Prisma.Decimal(10) } },
          },
        }),
      }),
    )
  })

  describe('listMonthlyResults', () => {
    const from = new Date('2026-09-30T17:00:00.000Z')
    const toExclusive = new Date('2026-10-31T17:00:00.000Z')

    function serviceWith(homeworkRows: unknown[], competitionRows: unknown[]) {
      const homeworkFindMany = jest.fn().mockReturnValue('homework-query')
      const competitionFindMany = jest.fn().mockReturnValue('competition-query')
      const transaction = jest.fn().mockResolvedValue([homeworkRows, competitionRows])
      const service = new PrismaParentStudentResultsReadService({
        homeworkSubmit: { findMany: homeworkFindMany },
        competitionSubmit: { findMany: competitionFindMany },
        $transaction: transaction,
      } as unknown as PrismaService)
      return { service, homeworkFindMany, competitionFindMany, transaction }
    }

    it('filters homework by submitAt and standalone completed competitions by submittedAt within the month', async () => {
      const { service, homeworkFindMany, competitionFindMany } = serviceWith([], [])

      await expect(service.listMonthlyResults(12, from, toExclusive)).resolves.toEqual([])

      expect(homeworkFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: 12, submitAt: { gte: from, lt: toExclusive } } }),
      )
      expect(competitionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId: 12,
            // Lượt thi gắn với HomeworkSubmit chỉ được tính ở phía homework.
            homeworkSubmit: null,
            status: { in: ['SUBMITTED', 'GRADED'] },
            submittedAt: { gte: from, lt: toExclusive },
          },
        }),
      )
    })

    it('maps homework and competition rows with the id of the matching detail', async () => {
      const submittedAt = new Date('2026-10-04T13:15:00.000Z')
      const { service } = serviceWith(
        [
          {
            homeworkSubmitId: 456,
            submitAt: submittedAt,
            points: null,
            homeworkContent: { learningItem: { title: 'Hàm số bậc hai' } },
            competitionSubmit: { totalPoints: new Prisma.Decimal(9), maxPoints: new Prisma.Decimal(10) },
          },
          {
            homeworkSubmitId: 457,
            submitAt: submittedAt,
            points: 80,
            homeworkContent: { learningItem: { title: 'Bài viết tay' } },
            competitionSubmit: null,
          },
        ],
        [
          {
            competitionSubmitId: 789,
            submittedAt,
            totalPoints: new Prisma.Decimal('7.5'),
            maxPoints: new Prisma.Decimal(10),
            competition: { title: 'Thi thử' },
          },
        ],
      )

      await expect(service.listMonthlyResults(12, from, toExclusive)).resolves.toEqual([
        { type: 'HOMEWORK', resultId: 456, title: 'Hàm số bậc hai', submittedAt, points: 9, maxPoints: 10 },
        { type: 'HOMEWORK', resultId: 457, title: 'Bài viết tay', submittedAt, points: 80, maxPoints: 100 },
        { type: 'COMPETITION', resultId: 789, title: 'Thi thử', submittedAt, points: 7.5, maxPoints: 10 },
      ])
    })

    it('drops a competition without submittedAt so it can never count or be latest', async () => {
      const { service } = serviceWith(
        [],
        [
          {
            competitionSubmitId: 1,
            submittedAt: null,
            totalPoints: new Prisma.Decimal(5),
            maxPoints: new Prisma.Decimal(10),
            competition: { title: 'Chưa nộp' },
          },
        ],
      )

      await expect(service.listMonthlyResults(12, from, toExclusive)).resolves.toEqual([])
    })
  })
})
