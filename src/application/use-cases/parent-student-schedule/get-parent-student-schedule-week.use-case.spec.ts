import type { AuthenticatedUser, ParentScheduleSession, ParentStudentScheduleReadService } from '../../interfaces'
import { ParentScheduleWeekQueryDto } from '../../dtos/parent-student-schedule'
import { AttendanceStatus } from '../../../shared/enums/attendance-status.enum'
import { GetParentStudentScheduleWeekUseCase } from '.'
import { resolveScheduleWeek } from './parent-student-schedule-week'

const parentIdentity: AuthenticatedUser = {
  userId: 10,
  username: 'parent-test',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

function query(weekStart: string): ParentScheduleWeekQueryDto {
  const dto = new ParentScheduleWeekQueryDto()
  dto.weekStart = weekStart
  return dto
}

function session(overrides: Partial<ParentScheduleSession> = {}): ParentScheduleSession {
  return {
    sessionId: 1,
    classId: 5,
    name: 'Buổi 1',
    sessionDate: new Date('2026-09-28T00:00:00.000Z'),
    startTime: new Date('1970-01-01T18:30:00.000Z'),
    endTime: new Date('1970-01-01T20:00:00.000Z'),
    className: 'Lớp A1',
    room: null,
    instructorName: null,
    makeupNote: null,
    attendance: null,
    homework: null,
    ...overrides,
  }
}

function service(sessions: ParentScheduleSession[] = [], linked = true) {
  return {
    isStudentLinked: jest.fn().mockResolvedValue(linked),
    listSessionsInRange: jest.fn().mockResolvedValue(sessions),
  } as unknown as jest.Mocked<ParentStudentScheduleReadService>
}

describe('GetParentStudentScheduleWeekUseCase', () => {
  it('rejects a parent that is not linked to the student before reading sessions', async () => {
    const reader = service([], false)

    await expect(
      new GetParentStudentScheduleWeekUseCase(reader).execute(parentIdentity, 99, query('2026-09-28')),
    ).rejects.toHaveProperty('name', 'ForbiddenException')

    expect(reader.isStudentLinked).toHaveBeenCalledWith(20, 99)
    expect(reader.listSessionsInRange).not.toHaveBeenCalled()
  })

  it.each([
    ['student', { userType: 'student', studentId: 99 } as Partial<AuthenticatedUser>],
    ['admin', { userType: 'admin', adminId: 1 } as Partial<AuthenticatedUser>],
    ['parent without parentId', { parentId: undefined } as Partial<AuthenticatedUser>],
  ])('rejects %s identity', async (_, override) => {
    const reader = service()

    await expect(
      new GetParentStudentScheduleWeekUseCase(reader).execute(
        { ...parentIdentity, ...override },
        99,
        query('2026-09-28'),
      ),
    ).rejects.toHaveProperty('name', 'ForbiddenException')
    expect(reader.isStudentLinked).not.toHaveBeenCalled()
  })

  it('queries the inclusive Monday-Sunday range and returns the week envelope', async () => {
    const reader = service()

    const result = await new GetParentStudentScheduleWeekUseCase(reader).execute(
      parentIdentity,
      12,
      query('2026-09-28'),
    )

    expect(reader.listSessionsInRange).toHaveBeenCalledWith(
      12,
      new Date('2026-09-28T00:00:00.000Z'),
      new Date('2026-10-04T00:00:00.000Z'),
    )
    expect(result.data).toEqual({
      studentId: 12,
      weekStart: '2026-09-28',
      weekEnd: '2026-10-04',
      sessions: [],
    })
  })

  it('keeps sessions without attendance and serializes date-only and time-only values', async () => {
    const result = await new GetParentStudentScheduleWeekUseCase(service([session()])).execute(
      parentIdentity,
      12,
      query('2026-09-28'),
    )

    expect(result.data?.sessions).toEqual([
      {
        sessionId: 1,
        classId: 5,
        name: 'Buổi 1',
        sessionDate: '2026-09-28',
        startTime: '18:30:00',
        endTime: '20:00:00',
        className: 'Lớp A1',
        room: null,
        instructorName: null,
        makeupNote: null,
        attendance: null,
        homework: null,
      },
    ])
  })

  it('serializes assigned homework and its optional submission score', async () => {
    const result = await new GetParentStudentScheduleWeekUseCase(
      service([
        session({ homework: { homeworkId: 20, submission: null } }),
        session({
          sessionId: 2,
          homework: {
            homeworkId: 21,
            submission: { homeworkSubmitId: 31, points: 8.5 },
          },
        }),
      ]),
    ).execute(parentIdentity, 12, query('2026-09-28'))

    expect(result.data?.sessions.map((item) => item.homework)).toEqual([
      { homeworkId: 20, submission: null },
      { homeworkId: 21, submission: { homeworkSubmitId: 31, points: 8.5 } },
    ])
  })

  it('maps attendance statuses and type independently while preserving ordering', async () => {
    const markedAt = new Date('2026-09-28T13:45:10.000Z')
    const sessions = [
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
      AttendanceStatus.LATE,
    ].map((status, index) =>
      session({
        sessionId: index + 1,
        room: 'P.201',
        instructorName: 'Nguyễn Văn An',
        makeupNote: 'Có thể học bù',
        attendance: { attendanceId: 100 + index, status, attendanceType: index === 2 ? 'MAKEUP' : 'REGULAR', markedAt, notes: 'Ghi chú' },
      }),
    )

    const result = await new GetParentStudentScheduleWeekUseCase(service(sessions)).execute(
      parentIdentity,
      12,
      query('2026-09-28'),
    )

    expect(result.data?.sessions.map((item) => item.sessionId)).toEqual([1, 2, 3])
    expect(result.data?.sessions.map((item) => item.attendance?.status)).toEqual([
      'PRESENT',
      'ABSENT',
      'LATE',
    ])
    expect(result.data?.sessions[0]).toMatchObject({
      room: 'P.201',
      instructorName: 'Nguyễn Văn An',
      makeupNote: 'Có thể học bù',
      attendance: {
        attendanceId: 100,
        attendanceType: 'REGULAR',
        markedAt: '2026-09-28T13:45:10.000Z',
        notes: 'Ghi chú',
      },
    })
    expect(result.data?.sessions[2].attendance?.attendanceType).toBe('MAKEUP')
  })
})

describe('resolveScheduleWeek', () => {
  it('covers a week that crosses a month and year boundary', () => {
    expect(resolveScheduleWeek('2025-12-29')).toMatchObject({
      weekStart: '2025-12-29',
      weekEnd: '2026-01-04',
    })
  })

  it('rejects a date that is not a Monday', () => {
    expect(() => resolveScheduleWeek('2026-09-29')).toThrow('thứ Hai')
  })

  it.each(['2026-02-30', '2026-13-01', 'abc', '2026-9-28', ''])('rejects invalid date %p', (value) => {
    expect(() => resolveScheduleWeek(value)).toThrow('không hợp lệ')
  })
})
