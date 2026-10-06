import type {
  AuthenticatedUser,
  ParentScheduleSessionDetail,
  ParentScheduleSessionDetailReadService,
  ParentStudentScheduleReadService,
} from '../../interfaces'
import { AttendanceStatus } from '../../../shared/enums/attendance-status.enum'
import { GetParentStudentScheduleSessionDetailUseCase } from '.'
import { resolveVietnamToday } from './parent-student-schedule-week'

const parentIdentity: AuthenticatedUser = {
  userId: 10,
  username: 'parent-test',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

function detail(overrides: Partial<ParentScheduleSessionDetail> = {}): ParentScheduleSessionDetail {
  return {
    sessionId: 1330,
    classId: 152,
    name: 'Buổi 02/10',
    sessionDate: new Date('2026-10-02T00:00:00.000Z'),
    startTime: new Date('1970-01-01T11:00:00.000Z'),
    endTime: new Date('1970-01-01T13:00:00.000Z'),
    className: 'Đại 1 lớp 11F',
    room: null,
    instructorName: 'Thầy Ngọc',
    makeupNote: null,
    attendance: null,
    homework: null,
    makeupOptions: [],
    ...overrides,
  }
}

function setup(found: ParentScheduleSessionDetail | null = detail(), linked = true) {
  const schedule = {
    isStudentLinked: jest.fn().mockResolvedValue(linked),
  } as unknown as jest.Mocked<ParentStudentScheduleReadService>
  const sessionDetail = {
    findSessionDetail: jest.fn().mockResolvedValue(found),
  } as unknown as jest.Mocked<ParentScheduleSessionDetailReadService>
  return { schedule, sessionDetail, useCase: new GetParentStudentScheduleSessionDetailUseCase(schedule, sessionDetail) }
}

describe('GetParentStudentScheduleSessionDetailUseCase', () => {
  it('rejects a parent that is not linked to the student before reading the session', async () => {
    const { useCase, schedule, sessionDetail } = setup(detail(), false)

    await expect(useCase.execute(parentIdentity, 99, 1330)).rejects.toHaveProperty('name', 'ForbiddenException')

    expect(schedule.isStudentLinked).toHaveBeenCalledWith(20, 99)
    expect(sessionDetail.findSessionDetail).not.toHaveBeenCalled()
  })

  it.each([
    ['student', { userType: 'student', studentId: 99 } as Partial<AuthenticatedUser>],
    ['admin', { userType: 'admin', adminId: 1 } as Partial<AuthenticatedUser>],
    ['parent without parentId', { parentId: undefined } as Partial<AuthenticatedUser>],
  ])('rejects %s identity', async (_, override) => {
    const { useCase, schedule } = setup()

    await expect(useCase.execute({ ...parentIdentity, ...override }, 95, 1330)).rejects.toHaveProperty(
      'name',
      'ForbiddenException',
    )
    expect(schedule.isStudentLinked).not.toHaveBeenCalled()
  })

  it('returns 404 when the session is missing or outside the student scope', async () => {
    const { useCase } = setup(null)

    const error = await useCase.execute(parentIdentity, 95, 1330).catch((e) => e)

    expect(error).toHaveProperty('name', 'NotFoundException')
    expect(error.getStatus()).toBe(404)
  })

  it('passes the Vietnam calendar date as the makeup expiry boundary', async () => {
    const { useCase, sessionDetail } = setup()

    // 18:30 UTC ngày 03/10 đã là 01:30 ngày 04/10 ở Asia/Ho_Chi_Minh.
    await useCase.execute(parentIdentity, 95, 1330, new Date('2026-10-03T18:30:00.000Z'))

    expect(sessionDetail.findSessionDetail).toHaveBeenCalledWith(95, 1330, new Date('2026-10-04T00:00:00.000Z'))
  })

  it('serializes a session without attendance and keeps makeup note and options', async () => {
    const { useCase } = setup(
      detail({
        makeupNote: 'Học bù thứ 7',
        makeupOptions: [
          {
            classId: 153,
            className: 'Đại 1 lớp 11G',
            startDate: new Date('2026-09-01T00:00:00.000Z'),
            endDate: null,
            weeklySchedule: 'Thứ 7 - 08:00',
            room: 'P305',
            instructorName: 'Cô Lan',
          },
        ],
      }),
    )

    const result = await useCase.execute(parentIdentity, 95, 1330)

    expect(result.data).toEqual({
      sessionId: 1330,
      studentId: 95,
      classId: 152,
      name: 'Buổi 02/10',
      sessionDate: '2026-10-02',
      startTime: '11:00:00',
      endTime: '13:00:00',
      className: 'Đại 1 lớp 11F',
      room: null,
      instructorName: 'Thầy Ngọc',
      makeupNote: 'Học bù thứ 7',
      attendance: null,
      homework: null,
      makeupOptions: [
        {
          classId: 153,
          className: 'Đại 1 lớp 11G',
          startDate: '2026-09-01',
          endDate: null,
          weeklySchedule: 'Thứ 7 - 08:00',
          room: 'P305',
          instructorName: 'Cô Lan',
        },
      ],
    })
  })

  it.each([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE])(
    'returns attendance, homework and makeup options for status %s',
    async (status) => {
      const markedAt = new Date('2026-10-02T06:10:00.000Z')
      const { useCase } = setup(
        detail({
          attendance: { attendanceId: 900, status, attendanceType: 'MAKEUP', markedAt, notes: null, markerName: 'Cô Lan' },
          homework: { homeworkId: 21, submission: { homeworkSubmitId: 31, points: 8.5 } },
          makeupOptions: [
            {
              classId: 153,
              className: 'Lớp B',
              startDate: null,
              endDate: null,
              weeklySchedule: null,
              room: null,
              instructorName: null,
            },
          ],
        }),
      )

      const result = await useCase.execute(parentIdentity, 95, 1330)

      expect(result.data?.attendance).toEqual({
        attendanceId: 900,
        status,
        attendanceType: 'MAKEUP',
        markedAt: '2026-10-02T06:10:00.000Z',
        notes: null,
        markerName: 'Cô Lan',
      })
      expect(result.data?.homework).toEqual({
        homeworkId: 21,
        submission: { homeworkSubmitId: 31, points: 8.5 },
      })
      expect(result.data?.makeupOptions).toHaveLength(1)
    },
  )

  it('keeps a nullable marker name', async () => {
    const { useCase } = setup(
      detail({
        attendance: {
          attendanceId: 1,
          status: AttendanceStatus.ABSENT,
          attendanceType: 'REGULAR',
          markedAt: new Date('2026-10-02T06:10:00.000Z'),
          notes: null,
          markerName: null,
        },
      }),
    )

    const result = await useCase.execute(parentIdentity, 95, 1330)

    expect(result.data?.attendance?.markerName).toBeNull()
  })
})

describe('resolveVietnamToday', () => {
  it('uses the Asia/Ho_Chi_Minh calendar date regardless of server timezone', () => {
    expect(resolveVietnamToday(new Date('2026-10-04T16:59:59.000Z'))).toEqual(new Date('2026-10-04T00:00:00.000Z'))
    expect(resolveVietnamToday(new Date('2026-10-04T17:00:00.000Z'))).toEqual(new Date('2026-10-05T00:00:00.000Z'))
  })
})
