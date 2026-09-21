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

  it('homework detail liên kết dùng điểm và nhận xét competition, giữ tên/ngày homework', async () => {
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
      feedback: 'Nhận xét bài thi',
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
})
