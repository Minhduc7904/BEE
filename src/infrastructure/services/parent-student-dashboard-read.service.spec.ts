import { PrismaParentStudentDashboardReadService } from './parent-student-dashboard-read.service'
import type { PrismaService } from '../../prisma/prisma.service'

describe('PrismaParentStudentDashboardReadService', () => {
  it('isStudentLinked checks the parent-student link', async () => {
    const findUnique = jest.fn().mockResolvedValueOnce({ studentId: 12 }).mockResolvedValueOnce(null)
    const service = new PrismaParentStudentDashboardReadService({
      parentStudent: { findUnique },
    } as unknown as PrismaService)

    await expect(service.isStudentLinked(20, 12)).resolves.toBe(true)
    await expect(service.isStudentLinked(20, 99)).resolves.toBe(false)
    expect(findUnique).toHaveBeenCalledWith({
      where: { parentId_studentId: { parentId: 20, studentId: 99 } },
      select: { studentId: true },
    })
  })

  describe('countAttendanceByStatus', () => {
    const from = new Date('2026-10-01T00:00:00.000Z')
    const toExclusive = new Date('2026-11-01T00:00:00.000Z')

    it('groups existing attendance records of the student by status within the session-date range', async () => {
      const groupBy = jest.fn().mockResolvedValue([])
      const service = new PrismaParentStudentDashboardReadService({
        attendance: { groupBy },
      } as unknown as PrismaService)

      await service.countAttendanceByStatus(12, from, toExclusive)

      expect(groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { studentId: 12, classSession: { sessionDate: { gte: from, lt: toExclusive } } },
        _count: { _all: true },
      })
    })

    it('maps groups to counts and defaults missing statuses to 0', async () => {
      const groupBy = jest.fn().mockResolvedValue([
        { status: 'PRESENT', _count: { _all: 8 } },
        { status: 'LATE', _count: { _all: 1 } },
      ])
      const service = new PrismaParentStudentDashboardReadService({
        attendance: { groupBy },
      } as unknown as PrismaService)

      await expect(service.countAttendanceByStatus(12, from, toExclusive)).resolves.toEqual({
        present: 8,
        absent: 0,
        late: 1,
        makeup: 0,
      })
    })

    it('returns all zeros for an empty month', async () => {
      const service = new PrismaParentStudentDashboardReadService({
        attendance: { groupBy: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService)

      await expect(service.countAttendanceByStatus(12, from, toExclusive)).resolves.toEqual({
        present: 0,
        absent: 0,
        late: 0,
        makeup: 0,
      })
    })
  })

  it('listUnpaidTuitionPayments reads only UNPAID payments of the student', async () => {
    const rows = [{ paymentId: 91, amount: null, month: 9, year: 2026 }]
    const findMany = jest.fn().mockResolvedValue(rows)
    const service = new PrismaParentStudentDashboardReadService({
      tuitionPayment: { findMany },
    } as unknown as PrismaService)

    await expect(service.listUnpaidTuitionPayments(12)).resolves.toEqual(rows)

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: 12, status: 'UNPAID' },
        select: { paymentId: true, amount: true, month: true, year: true },
      }),
    )
  })
})
