import { PrismaParentStudentScheduleReadService } from './parent-student-schedule-read.service'
import type { PrismaService } from '../../prisma/prisma.service'

function row(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 1,
    classId: 5,
    name: 'Buổi 1',
    sessionDate: new Date('2026-09-28T00:00:00.000Z'),
    startTime: new Date('1970-01-01T18:30:00.000Z'),
    endTime: new Date('1970-01-01T20:00:00.000Z'),
    makeupNote: null,
    courseClass: { className: 'Lớp A1', room: null, instructor: null },
    attendances: [],
    ...overrides,
  }
}

describe('PrismaParentStudentScheduleReadService', () => {
  it('isStudentLinked checks the parent-student link', async () => {
    const findUnique = jest.fn().mockResolvedValueOnce({ studentId: 12 }).mockResolvedValueOnce(null)
    const service = new PrismaParentStudentScheduleReadService({
      parentStudent: { findUnique },
    } as unknown as PrismaService)

    await expect(service.isStudentLinked(20, 12)).resolves.toBe(true)
    await expect(service.isStudentLinked(20, 99)).resolves.toBe(false)
    expect(findUnique).toHaveBeenCalledWith({
      where: { parentId_studentId: { parentId: 20, studentId: 99 } },
      select: { studentId: true },
    })
  })

  it('queries once, scoped to the student classes and joins only that student attendance', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const service = new PrismaParentStudentScheduleReadService({
      classSession: { findMany },
    } as unknown as PrismaService)
    const from = new Date('2026-09-28T00:00:00.000Z')
    const to = new Date('2026-10-04T00:00:00.000Z')

    await service.listSessionsInRange(12, from, to)

    expect(findMany).toHaveBeenCalledTimes(1)
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sessionDate: { gte: from, lte: to },
          courseClass: { classStudents: { some: { studentId: 12 } } },
        },
        orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }, { sessionId: 'asc' }],
      }),
    )
    const args = findMany.mock.calls[0][0]
    expect(args.select.attendances).toMatchObject({ where: { studentId: 12 }, take: 1 })
  })

  it('maps a session without attendance to attendance null and blanks to null', async () => {
    const findMany = jest.fn().mockResolvedValue([
      row({
        makeupNote: '',
        courseClass: { className: 'Lớp A1', room: '', instructor: { user: { firstName: '', lastName: '' } } },
      }),
    ])
    const service = new PrismaParentStudentScheduleReadService({
      classSession: { findMany },
    } as unknown as PrismaService)

    const [item] = await service.listSessionsInRange(12, new Date(), new Date())

    expect(item.attendance).toBeNull()
    expect(item.room).toBeNull()
    expect(item.instructorName).toBeNull()
    expect(item.makeupNote).toBeNull()
  })

  it.each(['PRESENT', 'ABSENT', 'LATE', 'MAKEUP'])('maps attendance status %s', async (status) => {
    const markedAt = new Date('2026-09-28T13:45:10.000Z')
    const findMany = jest.fn().mockResolvedValue([
      row({
        courseClass: {
          className: 'Lớp A1',
          room: 'P.201',
          instructor: { user: { firstName: 'An', lastName: 'Nguyễn Văn' } },
        },
        attendances: [{ attendanceId: 7, status, markedAt, notes: null }],
      }),
    ])
    const service = new PrismaParentStudentScheduleReadService({
      classSession: { findMany },
    } as unknown as PrismaService)

    const [item] = await service.listSessionsInRange(12, new Date(), new Date())

    expect(item.room).toBe('P.201')
    expect(item.instructorName).toBe('Nguyễn Văn An')
    expect(item.attendance).toEqual({ attendanceId: 7, status, markedAt, notes: null })
  })
})
