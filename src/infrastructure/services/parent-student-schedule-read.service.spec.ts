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
    homeworkId: null,
    homeworkContent: null,
    courseClass: {
      className: 'Lớp A1',
      room: null,
      instructor: null,
      weeklySchedule: null,
      startDate: null,
      endDate: null,
    },
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

  it('queries once for enrolled or attended sessions and joins only that student attendance', async () => {
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
          OR: [
            { courseClass: { classStudents: { some: { studentId: 12 } } } },
            { attendances: { some: { studentId: 12 } } },
          ],
        },
        orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }, { sessionId: 'asc' }],
      }),
    )
    const args = findMany.mock.calls[0][0]
    expect(args.select.attendances).toMatchObject({ where: { studentId: 12 }, take: 1 })
    expect(args.select.homeworkContent).toMatchObject({
      select: {
        homeworkSubmits: {
          where: { studentId: 12 },
          take: 1,
          select: { homeworkSubmitId: true, points: true },
        },
      },
    })
  })

  it('maps an attended makeup session even when it belongs to another class', async () => {
    const markedAt = new Date('2026-10-02T04:00:00.000Z')
    const findMany = jest.fn().mockResolvedValue([
      row({
        sessionId: 1330,
        classId: 152,
        name: 'Buổi học bù',
        courseClass: { className: 'Lớp học bù', room: null, instructor: null },
        attendances: [
          {
            attendanceId: 77,
            status: 'PRESENT',
            attendanceType: 'MAKEUP',
            makeupByAttendanceId: null,
            makeupBy: null,
            markedAt,
            notes: 'Học bù lớp khác',
          },
        ],
      }),
    ])
    const service = new PrismaParentStudentScheduleReadService({
      classSession: { findMany },
    } as unknown as PrismaService)

    const [item] = await service.listSessionsInRange(12, new Date(), new Date())

    expect(item).toMatchObject({
      sessionId: 1330,
      classId: 152,
      className: 'Lớp học bù',
      attendance: {
        attendanceId: 77,
        status: 'PRESENT',
        attendanceType: 'MAKEUP',
        makeupByAttendanceId: null,
        isMadeUp: false,
        makeupBy: null,
        markedAt,
        notes: 'Học bù lớp khác',
      },
    })
  })

  describe('isMadeUp / makeupBy', () => {
    const makeupRow = {
      attendanceId: 950,
      sessionId: 700,
      classSession: {
        classId: 31,
        sessionDate: new Date('2026-10-09T00:00:00.000Z'),
        startTime: new Date('1970-01-01T18:00:00.000Z'),
        endTime: new Date('1970-01-01T19:30:00.000Z'),
        courseClass: { className: 'Lớp bù' },
      },
    }

    function attendanceRow(overrides: Record<string, unknown>) {
      return {
        attendanceId: 7,
        status: 'ABSENT',
        attendanceType: 'REGULAR',
        makeupByAttendanceId: null,
        makeupBy: null,
        markedAt: new Date('2026-09-28T13:45:10.000Z'),
        notes: null,
        ...overrides,
      }
    }

    async function map(attendance: Record<string, unknown>) {
      const findMany = jest.fn().mockResolvedValue([row({ attendances: [attendance] })])
      const service = new PrismaParentStudentScheduleReadService({
        classSession: { findMany },
      } as unknown as PrismaService)
      const [item] = await service.listSessionsInRange(12, new Date(), new Date())
      return { item, findMany }
    }

    it('joins attendance.makeupBy.classSession.courseClass in the weekly schedule query', async () => {
      const { findMany } = await map(attendanceRow({}))

      expect(findMany.mock.calls[0][0].select.attendances.select.makeupBy).toEqual({
        select: {
          attendanceId: true,
          sessionId: true,
          classSession: {
            select: {
              classId: true,
              sessionDate: true,
              startTime: true,
              endTime: true,
              courseClass: { select: { className: true } },
            },
          },
        },
      })
    })

    it('marks an ABSENT attendance with a link as made up and exposes the class, date and time of the makeup', async () => {
      const { item } = await map(attendanceRow({ makeupByAttendanceId: 950, makeupBy: makeupRow }))

      expect(item.attendance).toMatchObject({
        status: 'ABSENT',
        makeupByAttendanceId: 950,
        isMadeUp: true,
        makeupBy: {
          attendanceId: 950,
          sessionId: 700,
          classId: 31,
          className: 'Lớp bù',
          sessionDate: new Date('2026-10-09T00:00:00.000Z'),
          startTime: new Date('1970-01-01T18:00:00.000Z'),
          endTime: new Date('1970-01-01T19:30:00.000Z'),
        },
      })
    })

    it('does not mark an unlinked ABSENT attendance as made up', async () => {
      const { item } = await map(attendanceRow({}))

      expect(item.attendance).toMatchObject({ isMadeUp: false, makeupBy: null, makeupByAttendanceId: null })
    })

    it('does not infer made up from attendanceType or makeupNote', async () => {
      const findMany = jest.fn().mockResolvedValue([
        row({
          makeupNote: 'Đã học bù',
          attendances: [attendanceRow({ status: 'PRESENT', attendanceType: 'MAKEUP' })],
        }),
      ])
      const service = new PrismaParentStudentScheduleReadService({
        classSession: { findMany },
      } as unknown as PrismaService)

      const [item] = await service.listSessionsInRange(12, new Date(), new Date())

      expect(item.attendance).toMatchObject({ attendanceType: 'MAKEUP', isMadeUp: false, makeupBy: null })
    })

    it('only ABSENT records can be made up even if a stale link exists on another status', async () => {
      const { item } = await map(attendanceRow({ status: 'PRESENT', makeupByAttendanceId: 950, makeupBy: makeupRow }))

      expect(item.attendance).toMatchObject({ isMadeUp: false, makeupBy: null })
    })
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
    expect(item.homework).toBeNull()
  })

  it('distinguishes unassigned, not submitted, submitted ungraded and graded homework', async () => {
    const findMany = jest.fn().mockResolvedValue([
      row(),
      row({ sessionId: 2, homeworkId: 20, homeworkContent: { homeworkSubmits: [] } }),
      row({
        sessionId: 3,
        homeworkId: 21,
        homeworkContent: { homeworkSubmits: [{ homeworkSubmitId: 31, points: null }] },
      }),
      row({
        sessionId: 4,
        homeworkId: 22,
        homeworkContent: { homeworkSubmits: [{ homeworkSubmitId: 32, points: 8.5 }] },
      }),
    ])
    const service = new PrismaParentStudentScheduleReadService({
      classSession: { findMany },
    } as unknown as PrismaService)

    const items = await service.listSessionsInRange(12, new Date(), new Date())

    expect(items.map((item) => item.homework)).toEqual([
      null,
      { homeworkId: 20, submission: null },
      { homeworkId: 21, submission: { homeworkSubmitId: 31, points: null } },
      { homeworkId: 22, submission: { homeworkSubmitId: 32, points: 8.5 } },
    ])
  })

  it.each(['PRESENT', 'ABSENT', 'LATE'])('maps attendance status %s', async (status) => {
    const markedAt = new Date('2026-09-28T13:45:10.000Z')
    const findMany = jest.fn().mockResolvedValue([
      row({
        courseClass: {
          className: 'Lớp A1',
          room: 'P.201',
          instructor: { user: { firstName: 'An', lastName: 'Nguyễn Văn' } },
        },
        attendances: [
          {
            attendanceId: 7,
            status,
            attendanceType: 'REGULAR',
            makeupByAttendanceId: null,
            makeupBy: null,
            markedAt,
            notes: null,
          },
        ],
      }),
    ])
    const service = new PrismaParentStudentScheduleReadService({
      classSession: { findMany },
    } as unknown as PrismaService)

    const [item] = await service.listSessionsInRange(12, new Date(), new Date())

    expect(item.room).toBe('P.201')
    expect(item.instructorName).toBe('Nguyễn Văn An')
    expect(item.attendance).toEqual({
      attendanceId: 7,
      status,
      attendanceType: 'REGULAR',
      makeupByAttendanceId: null,
      isMadeUp: false,
      makeupBy: null,
      markedAt,
      notes: null,
    })
  })

  describe('findNextSession', () => {
    const clock = {
      today: new Date('2026-10-05T00:00:00.000Z'),
      timeOfDay: new Date('1970-01-01T19:00:00.000Z'),
    }

    const scope = {
      OR: [
        { courseClass: { classStudents: { some: { studentId: 12 } } } },
        { attendances: { some: { studentId: 12 } } },
      ],
    }

    it('queries enrolled classes and makeup sessions with attendance, for sessions that have not ended', async () => {
      const findFirst = jest.fn().mockResolvedValue(null)
      const service = new PrismaParentStudentScheduleReadService({
        classSession: { findFirst },
      } as unknown as PrismaService)

      await expect(service.findNextSession(12, clock)).resolves.toBeNull()

      expect(findFirst).toHaveBeenCalledTimes(1)
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              scope,
              {
                OR: [
                  { sessionDate: { gt: clock.today } },
                  { sessionDate: clock.today, endTime: { gt: clock.timeOfDay } },
                ],
              },
            ],
          },
          orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }, { sessionId: 'asc' }],
        }),
      )
    })

    it('uses the same student scope as the weekly schedule', async () => {
      const findMany = jest.fn().mockResolvedValue([])
      const findFirst = jest.fn().mockResolvedValue(null)
      const service = new PrismaParentStudentScheduleReadService({
        classSession: { findFirst, findMany },
      } as unknown as PrismaService)

      await service.findNextSession(12, clock)
      await service.listSessionsInRange(12, new Date('2026-10-05T00:00:00.000Z'), new Date('2026-10-11T00:00:00.000Z'))

      expect(findFirst.mock.calls[0][0].where.AND[0].OR).toEqual(findMany.mock.calls[0][0].where.OR)
    })

    it('scopes the attendance of the makeup match to the student, not other students', async () => {
      const findFirst = jest.fn().mockResolvedValue(null)
      const service = new PrismaParentStudentScheduleReadService({
        classSession: { findFirst },
      } as unknown as PrismaService)

      await service.findNextSession(12, clock)

      expect(JSON.stringify(findFirst.mock.calls[0][0].where)).toContain('"attendances":{"some":{"studentId":12}}')
    })

    it('scopes attendance and homework submission to the student and maps the row', async () => {
      const findFirst = jest.fn().mockResolvedValue(row({ sessionId: 123, classId: 12 }))
      const service = new PrismaParentStudentScheduleReadService({
        classSession: { findFirst },
      } as unknown as PrismaService)

      const session = await service.findNextSession(12, clock)

      const args = findFirst.mock.calls[0][0]
      expect(args.select.attendances).toMatchObject({ where: { studentId: 12 }, take: 1 })
      expect(args.select.homeworkContent.select.homeworkSubmits).toMatchObject({ where: { studentId: 12 }, take: 1 })
      expect(session).toMatchObject({ sessionId: 123, classId: 12, className: 'Lớp A1', attendance: null })
    })
  })

  describe('findNextSession class facts', () => {
    const clock = {
      today: new Date('2026-10-05T00:00:00.000Z'),
      timeOfDay: new Date('1970-01-01T19:00:00.000Z'),
    }

    it('also selects the weekly schedule and class dates and joins attendance.makeupBy', async () => {
      const findFirst = jest.fn().mockResolvedValue(null)
      const service = new PrismaParentStudentScheduleReadService({
        classSession: { findFirst },
      } as unknown as PrismaService)

      await service.findNextSession(12, clock)

      const select = findFirst.mock.calls[0][0].select
      expect(select.courseClass.select).toMatchObject({ weeklySchedule: true, startDate: true, endDate: true })
      expect(select.attendances.select.makeupBy.select.classSession.select.courseClass).toEqual({
        select: { className: true },
      })
    })

    it('maps class facts next to the session fields', async () => {
      const startDate = new Date('2026-09-01T00:00:00.000Z')
      const findFirst = jest.fn().mockResolvedValue(
        row({
          courseClass: {
            className: 'Lớp A1',
            room: 'P.1',
            instructor: null,
            weeklySchedule: 'Thứ 2 - 18:30',
            startDate,
            endDate: null,
          },
        }),
      )
      const service = new PrismaParentStudentScheduleReadService({
        classSession: { findFirst },
      } as unknown as PrismaService)

      await expect(service.findNextSession(12, clock)).resolves.toMatchObject({
        sessionId: 1,
        classWeeklySchedule: 'Thứ 2 - 18:30',
        classStartDate: startDate,
        classEndDate: null,
      })
    })
  })

  describe('listNonEndedEnrolledClasses', () => {
    const today = new Date('2026-10-05T00:00:00.000Z')

    it('reads only enrolled classes that have not ended, never classes reached only through attendance', async () => {
      const findMany = jest.fn().mockResolvedValue([])
      const service = new PrismaParentStudentScheduleReadService({
        courseClass: { findMany },
      } as unknown as PrismaService)

      await service.listNonEndedEnrolledClasses(12, today)

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            classStudents: { some: { studentId: 12 } },
            OR: [{ endDate: null }, { endDate: { gte: today } }],
          },
        }),
      )
    })

    it('maps class facts and turns blank strings into null', async () => {
      const findMany = jest.fn().mockResolvedValue([
        {
          classId: 3,
          className: 'Lớp C',
          weeklySchedule: '',
          startDate: null,
          endDate: new Date('2026-12-31T00:00:00.000Z'),
          room: '',
          instructor: { user: { firstName: 'An', lastName: 'Nguyễn' } },
        },
      ])
      const service = new PrismaParentStudentScheduleReadService({
        courseClass: { findMany },
      } as unknown as PrismaService)

      await expect(service.listNonEndedEnrolledClasses(12, today)).resolves.toEqual([
        {
          classId: 3,
          className: 'Lớp C',
          weeklySchedule: null,
          classStartDate: null,
          classEndDate: new Date('2026-12-31T00:00:00.000Z'),
          room: null,
          instructorName: 'Nguyễn An',
        },
      ])
    })
  })
})
