import type {
  AuthenticatedUser,
  ParentNextScheduleClass,
  ParentNextScheduleSession,
  ParentStudentScheduleReadService,
} from '../../interfaces'
import { AttendanceStatus } from '../../../shared/enums/attendance-status.enum'
import { AttendanceType } from '../../../shared/enums/attendance-type.enum'
import { ParentScheduleStatus } from '../../../shared/enums/parent-schedule-status.enum'
import { GetParentStudentNextScheduleOverviewUseCase } from '.'
import { selectFallbackClass } from './select-fallback-class'
import { resolveScheduleStatus, resolveVietnamClock } from './parent-student-schedule-week'

const parentIdentity: AuthenticatedUser = {
  userId: 10,
  username: 'parent-test',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

function session(overrides: Partial<ParentNextScheduleSession> = {}): ParentNextScheduleSession {
  return {
    sessionId: 123,
    classId: 12,
    name: 'Buổi 8',
    sessionDate: new Date('2026-10-05T00:00:00.000Z'),
    startTime: new Date('1970-01-01T18:30:00.000Z'),
    endTime: new Date('1970-01-01T20:00:00.000Z'),
    className: 'Toán 10A',
    room: 'P.201',
    instructorName: 'Giáo viên A',
    makeupNote: null,
    attendance: null,
    homework: null,
    classWeeklySchedule: 'Thứ 2, 4 - 18:30',
    classStartDate: new Date('2026-09-01T00:00:00.000Z'),
    classEndDate: null,
    ...overrides,
  }
}

function klass(overrides: Partial<ParentNextScheduleClass> = {}): ParentNextScheduleClass {
  return {
    classId: 1,
    className: 'Lớp A',
    weeklySchedule: 'Thứ 3 - 19:00',
    classStartDate: new Date('2026-09-01T00:00:00.000Z'),
    classEndDate: new Date('2026-12-31T00:00:00.000Z'),
    room: 'P.1',
    instructorName: 'GV A',
    ...overrides,
  }
}

function service(
  next: ParentNextScheduleSession | null = null,
  linked = true,
  classes: ParentNextScheduleClass[] = [],
) {
  return {
    isStudentLinked: jest.fn().mockResolvedValue(linked),
    findNextSession: jest.fn().mockResolvedValue(next),
    listNonEndedEnrolledClasses: jest.fn().mockResolvedValue(classes),
  } as unknown as jest.Mocked<ParentStudentScheduleReadService>
}

// 2026-10-05T12:00:00Z = 19:00 ngày 05/10/2026 giờ Việt Nam
const nowVietnam1900 = new Date('2026-10-05T12:00:00.000Z')

describe('resolveVietnamClock', () => {
  it('returns today and the wall-clock time in Asia/Ho_Chi_Minh', () => {
    const clock = resolveVietnamClock(nowVietnam1900)

    expect(clock.today.toISOString()).toBe('2026-10-05T00:00:00.000Z')
    expect(clock.timeOfDay.toISOString()).toBe('1970-01-01T19:00:00.000Z')
  })

  it('rolls the date forward after 17:00 UTC', () => {
    const clock = resolveVietnamClock(new Date('2026-10-05T17:30:15.000Z'))

    expect(clock.today.toISOString()).toBe('2026-10-06T00:00:00.000Z')
    expect(clock.timeOfDay.toISOString()).toBe('1970-01-01T00:30:15.000Z')
  })

  it('keeps midnight as 00:00:00 rather than 24:00:00', () => {
    const clock = resolveVietnamClock(new Date('2026-10-05T17:00:00.000Z'))

    expect(clock.timeOfDay.toISOString()).toBe('1970-01-01T00:00:00.000Z')
  })
})

describe('resolveScheduleStatus', () => {
  const clock = resolveVietnamClock(nowVietnam1900)

  it('is IN_PROGRESS for a session that started earlier today', () => {
    expect(resolveScheduleStatus(session({ startTime: new Date('1970-01-01T18:30:00.000Z') }), clock)).toBe(
      ParentScheduleStatus.IN_PROGRESS,
    )
  })

  it('is IN_PROGRESS when the session starts exactly now', () => {
    expect(resolveScheduleStatus(session({ startTime: new Date('1970-01-01T19:00:00.000Z') }), clock)).toBe(
      ParentScheduleStatus.IN_PROGRESS,
    )
  })

  it('is UPCOMING for a session that starts later today', () => {
    expect(resolveScheduleStatus(session({ startTime: new Date('1970-01-01T19:30:00.000Z') }), clock)).toBe(
      ParentScheduleStatus.UPCOMING,
    )
  })

  it('is UPCOMING for a future date even if its start time is earlier than now', () => {
    expect(
      resolveScheduleStatus(
        session({
          sessionDate: new Date('2026-10-12T00:00:00.000Z'),
          startTime: new Date('1970-01-01T08:00:00.000Z'),
        }),
        clock,
      ),
    ).toBe(ParentScheduleStatus.UPCOMING)
  })
})

describe('GetParentStudentNextScheduleOverviewUseCase', () => {
  const run = (reader: jest.Mocked<ParentStudentScheduleReadService>, studentId = 12) =>
    new GetParentStudentNextScheduleOverviewUseCase(reader).execute(parentIdentity, studentId, nowVietnam1900)

  it('rejects a parent that is not linked to the student before reading sessions', async () => {
    const reader = service(session(), false)

    await expect(
      new GetParentStudentNextScheduleOverviewUseCase(reader).execute(parentIdentity, 99, nowVietnam1900),
    ).rejects.toHaveProperty('name', 'ForbiddenException')

    expect(reader.isStudentLinked).toHaveBeenCalledWith(20, 99)
    expect(reader.findNextSession).not.toHaveBeenCalled()
    expect(reader.listNonEndedEnrolledClasses).not.toHaveBeenCalled()
  })

  it.each([
    ['student', { userType: 'student', studentId: 99 } as Partial<AuthenticatedUser>],
    ['admin', { userType: 'admin', adminId: 1 } as Partial<AuthenticatedUser>],
    ['parent without parentId', { parentId: undefined } as Partial<AuthenticatedUser>],
  ])('rejects %s identity', async (_, override) => {
    const reader = service(session())

    await expect(
      new GetParentStudentNextScheduleOverviewUseCase(reader).execute(
        { ...parentIdentity, ...override },
        99,
        nowVietnam1900,
      ),
    ).rejects.toHaveProperty('name', 'ForbiddenException')
    expect(reader.isStudentLinked).not.toHaveBeenCalled()
    expect(reader.findNextSession).not.toHaveBeenCalled()
  })

  it('asks the reader for the first unfinished session using the Vietnam clock', async () => {
    const reader = service(session())

    await run(reader)

    expect(reader.findNextSession).toHaveBeenCalledWith(12, resolveVietnamClock(nowVietnam1900))
    expect(reader.listNonEndedEnrolledClasses).not.toHaveBeenCalled()
  })

  it('returns the in-progress session as a flat SESSION overview', async () => {
    const result = await run(service(session()))

    expect(result).toEqual({
      success: true,
      message: 'Lấy buổi học tiếp theo thành công',
      data: {
        source: 'SESSION',
        classId: 12,
        className: 'Toán 10A',
        weeklySchedule: 'Thứ 2, 4 - 18:30',
        classStartDate: '2026-09-01',
        classEndDate: null,
        room: 'P.201',
        instructorName: 'Giáo viên A',
        sessionId: 123,
        sessionName: 'Buổi 8',
        sessionDate: '2026-10-05',
        startTime: '18:30:00',
        endTime: '20:00:00',
        makeupNote: null,
        attendance: null,
        homework: null,
        scheduleStatus: 'IN_PROGRESS',
      },
    })
  })

  it('returns a future session of a later week as UPCOMING', async () => {
    const result = await run(service(session({ sessionDate: new Date('2026-10-13T00:00:00.000Z') })))

    expect(result.data).toMatchObject({ source: 'SESSION', sessionDate: '2026-10-13', scheduleStatus: 'UPCOMING' })
  })

  it('keeps a makeup session of another class as SESSION with its attendance and linked makeup reference', async () => {
    const result = await run(
      service(
        session({
          classId: 99,
          className: 'Lớp khác',
          attendance: {
            attendanceId: 5,
            status: AttendanceStatus.ABSENT,
            attendanceType: AttendanceType.REGULAR,
            makeupByAttendanceId: 9,
            isMadeUp: true,
            makeupBy: {
              attendanceId: 9,
              sessionId: 700,
              classId: 31,
              className: 'Lớp bù',
              sessionDate: new Date('2026-10-02T00:00:00.000Z'),
              startTime: new Date('1970-01-01T18:00:00.000Z'),
              endTime: new Date('1970-01-01T19:30:00.000Z'),
            },
            markedAt: new Date('2026-10-01T03:00:00.000Z'),
            notes: null,
          },
        }),
      ),
    )

    expect(result.data).toMatchObject({
      source: 'SESSION',
      classId: 99,
      attendance: {
        status: 'ABSENT',
        attendanceType: 'REGULAR',
        makeupByAttendanceId: 9,
        isMadeUp: true,
        makeupBy: {
          attendanceId: 9,
          sessionId: 700,
          classId: 31,
          className: 'Lớp bù',
          sessionDate: '2026-10-02',
          startTime: '18:00:00',
          endTime: '19:30:00',
        },
      },
    })
  })

  describe('class fallback', () => {
    it('returns a CLASS_FALLBACK overview with every session field null', async () => {
      const reader = service(null, true, [klass()])

      const result = await run(reader)

      expect(reader.listNonEndedEnrolledClasses).toHaveBeenCalledWith(12, resolveVietnamClock(nowVietnam1900).today)
      expect(result).toEqual({
        success: true,
        message: 'Lấy buổi học tiếp theo thành công',
        data: {
          source: 'CLASS_FALLBACK',
          classId: 1,
          className: 'Lớp A',
          weeklySchedule: 'Thứ 3 - 19:00',
          classStartDate: '2026-09-01',
          classEndDate: '2026-12-31',
          room: 'P.1',
          instructorName: 'GV A',
          sessionId: null,
          sessionName: null,
          sessionDate: null,
          startTime: null,
          endTime: null,
          makeupNote: null,
          attendance: null,
          homework: null,
          scheduleStatus: null,
        },
      })
    })

    it('keeps weeklySchedule null when the class has none', async () => {
      const result = await run(service(null, true, [klass({ weeklySchedule: null })]))

      expect(result.data).toMatchObject({ source: 'CLASS_FALLBACK', weeklySchedule: null })
    })

    it('returns data null when the student has no classes', async () => {
      const result = await run(service(null))

      expect(result).toEqual({ success: true, message: 'Không có buổi học sắp tới', data: null })
    })

    it('returns data null when every class has ended', async () => {
      const ended = klass({ classEndDate: new Date('2026-10-04T00:00:00.000Z') })

      const result = await run(service(null, true, [ended]))

      expect(result.data).toBeNull()
    })
  })
})

describe('selectFallbackClass', () => {
  const today = new Date('2026-10-05T00:00:00.000Z')
  const day = (value: string) => new Date(`${value}T00:00:00.000Z`)

  it('prefers the active class whose finite endDate is nearest', () => {
    const far = klass({ classId: 1, classEndDate: day('2026-12-31') })
    const near = klass({ classId: 2, classEndDate: day('2026-10-20') })

    expect(selectFallbackClass([far, near], today)?.classId).toBe(2)
  })

  it('treats null start and end dates as active and ranks endDate null after a finite endDate', () => {
    const open = klass({ classId: 1, classStartDate: null, classEndDate: null })
    const finite = klass({ classId: 2, classStartDate: null, classEndDate: day('2026-11-30') })

    expect(selectFallbackClass([open], today)?.classId).toBe(1)
    expect(selectFallbackClass([open, finite], today)?.classId).toBe(2)
  })

  it('breaks ties by classId, including between classes without an endDate', () => {
    const sameEndB = klass({ classId: 8, classEndDate: day('2026-11-01') })
    const sameEndA = klass({ classId: 3, classEndDate: day('2026-11-01') })
    const openB = klass({ classId: 20, classEndDate: null })
    const openA = klass({ classId: 15, classEndDate: null })

    expect(selectFallbackClass([sameEndB, sameEndA], today)?.classId).toBe(3)
    expect(selectFallbackClass([openB, openA], today)?.classId).toBe(15)
  })

  it('counts a class that starts or ends today as active', () => {
    const startsToday = klass({ classId: 1, classStartDate: today, classEndDate: null })
    const endsToday = klass({ classId: 2, classStartDate: day('2026-09-01'), classEndDate: today })

    expect(selectFallbackClass([startsToday, endsToday], today)?.classId).toBe(2)
  })

  it('falls back to the nearest future class when none is active', () => {
    const later = klass({ classId: 1, classStartDate: day('2026-11-15'), classEndDate: null })
    const sooner = klass({ classId: 2, classStartDate: day('2026-10-20'), classEndDate: null })
    const sameStart = klass({ classId: 0, classStartDate: day('2026-10-20'), classEndDate: null })

    expect(selectFallbackClass([later, sooner], today)?.classId).toBe(2)
    expect(selectFallbackClass([later, sooner, sameStart], today)?.classId).toBe(0)
  })

  it('prefers an active class over a future class', () => {
    const future = klass({ classId: 1, classStartDate: day('2026-10-06'), classEndDate: null })
    const active = klass({ classId: 2, classStartDate: day('2026-09-01'), classEndDate: null })

    expect(selectFallbackClass([future, active], today)?.classId).toBe(2)
  })

  it('returns null when all classes have ended or there are no classes', () => {
    const ended = klass({ classId: 1, classStartDate: day('2026-01-01'), classEndDate: day('2026-10-04') })

    expect(selectFallbackClass([ended], today)).toBeNull()
    expect(selectFallbackClass([], today)).toBeNull()
  })
})
