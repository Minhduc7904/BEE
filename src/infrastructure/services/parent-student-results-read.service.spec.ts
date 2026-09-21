import { Prisma } from '@prisma/client'

import { PrismaParentStudentResultsReadService } from './parent-student-results-read.service'
import type { PrismaService } from '../../prisma/prisma.service'

describe('PrismaParentStudentResultsReadService', () => {
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
