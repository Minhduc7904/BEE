import type { AuthenticatedUser, ParentScheduleSession, ParentStudentScheduleReadService } from '../../interfaces'
import { ParentScheduleStatus } from '../../../shared/enums/parent-schedule-status.enum'
import { GetParentStudentNextScheduleSessionUseCase } from '.'
import { resolveScheduleStatus, resolveVietnamClock } from './parent-student-schedule-week'

const parentIdentity: AuthenticatedUser = {
  userId: 10,
  username: 'parent-test',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

function session(overrides: Partial<ParentScheduleSession> = {}): ParentScheduleSession {
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
    ...overrides,
  }
}

function service(next: ParentScheduleSession | null = null, linked = true) {
  return {
    isStudentLinked: jest.fn().mockResolvedValue(linked),
    findNextSession: jest.fn().mockResolvedValue(next),
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

  it('is ONGOING for a session that started earlier today', () => {
    expect(resolveScheduleStatus(session({ startTime: new Date('1970-01-01T18:30:00.000Z') }), clock)).toBe(
      ParentScheduleStatus.ONGOING,
    )
  })

  it('is ONGOING when the session starts exactly now', () => {
    expect(resolveScheduleStatus(session({ startTime: new Date('1970-01-01T19:00:00.000Z') }), clock)).toBe(
      ParentScheduleStatus.ONGOING,
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

describe('GetParentStudentNextScheduleSessionUseCase', () => {
  it('rejects a parent that is not linked to the student before reading sessions', async () => {
    const reader = service(session(), false)

    await expect(
      new GetParentStudentNextScheduleSessionUseCase(reader).execute(parentIdentity, 99, nowVietnam1900),
    ).rejects.toHaveProperty('name', 'ForbiddenException')

    expect(reader.isStudentLinked).toHaveBeenCalledWith(20, 99)
    expect(reader.findNextSession).not.toHaveBeenCalled()
  })

  it.each([
    ['student', { userType: 'student', studentId: 99 } as Partial<AuthenticatedUser>],
    ['admin', { userType: 'admin', adminId: 1 } as Partial<AuthenticatedUser>],
    ['parent without parentId', { parentId: undefined } as Partial<AuthenticatedUser>],
  ])('rejects %s identity', async (_, override) => {
    const reader = service(session())

    await expect(
      new GetParentStudentNextScheduleSessionUseCase(reader).execute(
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

    await new GetParentStudentNextScheduleSessionUseCase(reader).execute(parentIdentity, 12, nowVietnam1900)

    expect(reader.findNextSession).toHaveBeenCalledWith(12, resolveVietnamClock(nowVietnam1900))
  })

  it('returns the ongoing session with the wire shape and ONGOING status', async () => {
    const reader = service(session())

    const result = await new GetParentStudentNextScheduleSessionUseCase(reader).execute(
      parentIdentity,
      12,
      nowVietnam1900,
    )

    expect(result).toMatchObject({
      success: true,
      message: 'Lấy buổi học tiếp theo thành công',
      data: {
        sessionId: 123,
        classId: 12,
        name: 'Buổi 8',
        sessionDate: '2026-10-05',
        startTime: '18:30:00',
        endTime: '20:00:00',
        className: 'Toán 10A',
        room: 'P.201',
        instructorName: 'Giáo viên A',
        makeupNote: null,
        attendance: null,
        homework: null,
        scheduleStatus: 'ONGOING',
      },
    })
  })

  it('returns a future session of a later week as UPCOMING', async () => {
    const reader = service(session({ sessionDate: new Date('2026-10-13T00:00:00.000Z') }))

    const result = await new GetParentStudentNextScheduleSessionUseCase(reader).execute(
      parentIdentity,
      12,
      nowVietnam1900,
    )

    expect(result.data).toMatchObject({ sessionDate: '2026-10-13', scheduleStatus: 'UPCOMING' })
  })

  it('returns data null when there is no upcoming session', async () => {
    const reader = service(null)

    const result = await new GetParentStudentNextScheduleSessionUseCase(reader).execute(
      parentIdentity,
      12,
      nowVietnam1900,
    )

    expect(result).toEqual({ success: true, message: 'Không có buổi học sắp tới', data: null })
  })
})
