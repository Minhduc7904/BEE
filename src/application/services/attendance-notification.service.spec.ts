import { Attendance } from '../../domain/entities/attendance/attendance.entity'
import { ClassSession } from '../../domain/entities/class-session/class-session.entity'
import type { UnitOfWorkRepos } from '../../domain/repositories'
import { AttendanceStatus, AttendanceType, NotificationDestinationType } from '../../shared/enums'
import { AttendanceNotificationService } from './attendance-notification.service'

const repos = {} as UnitOfWorkRepos

// 18:00-20:00 giờ VN = 11:00-13:00 UTC
const session = new ClassSession({
  sessionId: 7,
  classId: 10,
  name: 'Buổi 7',
  sessionDate: new Date('2026-10-14T00:00:00.000Z'),
  startTime: new Date('1970-01-01T11:00:00.000Z'),
  endTime: new Date('1970-01-01T13:00:00.000Z'),
  makeupNote: 'Thứ 6 18:00',
  courseClass: { className: 'Toán 9A' } as never,
})

function attendance(
  id: number,
  studentId: number,
  overrides: Partial<ConstructorParameters<typeof Attendance>[0]> = {},
) {
  return new Attendance({
    attendanceId: id,
    sessionId: 7,
    studentId,
    status: AttendanceStatus.ABSENT,
    markedAt: new Date('2026-10-14T11:05:00.000Z'),
    student: {
      studentId,
      userId: 1000 + studentId,
      parentZaloId: `zalo-${studentId}`,
      user: { firstName: 'An', lastName: 'Nguyễn' },
    } as never,
    classSession: session,
    ...overrides,
  })
}

function setup(queued: unknown = { businessNotificationOutboxId: 1 }) {
  const queue = { enqueueStudentAndParentsWithRepos: jest.fn().mockResolvedValue(queued) }
  return { queue, service: new AttendanceNotificationService(queue as never) }
}

describe('AttendanceNotificationService.enqueueSessionMoment', () => {
  it('mốc 15 phút: mỗi học sinh một target với payload cho học sinh, phụ huynh và Zalo', async () => {
    const { queue, service } = setup()

    const count = await service.enqueueSessionMoment(repos, session, 'ABSENT_REMINDER', [
      attendance(1, 100),
      attendance(2, 101),
    ])

    expect(count).toBe(2)
    const input = queue.enqueueStudentAndParentsWithRepos.mock.calls[0][1]
    expect(input).toMatchObject({
      sourceType: 'CLASS_SESSION',
      sourceId: '7',
      sourceEvent: 'ABSENT_REMINDER',
      idempotencyKey: 'class-session:7:ABSENT_REMINDER:2026-10-14T11:15:00.000Z',
    })
    expect(input.targets).toHaveLength(2)
    expect(input.targets[0]).toMatchObject({
      studentId: 100,
      studentUserId: 1100,
      parentZaloId: 'zalo-100',
    })
    expect(input.targets[0].studentPayload.message).toBe('Bạn chưa có mặt ở buổi Buổi 7 lớp Toán 9A.')
    expect(input.targets[0].parentPayload.message).toContain('Đến 18:15 con chưa có mặt tại lớp.')
    expect(input.targets[0].parentPayload.message).toContain('HỌC SINH: Nguyễn An')
    expect(input.targets[0].zaloPayload).toBe(input.targets[0].parentPayload)
    expect(input.targets[0].zaloAppId).toBeTruthy()
  })

  it('mốc hết giờ: tin vắng kèm lịch học bù, idempotencyKey theo mốc hết giờ', async () => {
    const { queue, service } = setup()

    await service.enqueueSessionMoment(repos, session, 'ABSENCE_SUMMARY', [attendance(1, 100)])

    const input = queue.enqueueStudentAndParentsWithRepos.mock.calls[0][1]
    expect(input.sourceEvent).toBe('ABSENCE_SUMMARY')
    expect(input.idempotencyKey).toBe('class-session:7:ABSENCE_SUMMARY:2026-10-14T13:00:00.000Z')
    expect(input.targets[0].parentPayload.message).toContain('Hôm nay con vắng buổi học Buổi 7.')
    expect(input.targets[0].parentPayload.message).toContain('LỊCH HỌC BÙ: Thứ 6 18:00')
    expect(input.targets[0].studentPayload.message).toBe('Bạn đã vắng buổi Buổi 7 lớp Toán 9A.')
  })

  it.each(['ABSENT_REMINDER', 'ABSENCE_SUMMARY'] as const)(
    '%s: payload phụ huynh và học sinh trỏ tới chi tiết buổi học (schedule_session)',
    async (moment) => {
      const { queue, service } = setup()

      await service.enqueueSessionMoment(repos, session, moment, [attendance(1, 100)])

      const target = queue.enqueueStudentAndParentsWithRepos.mock.calls[0][1].targets[0]
      for (const payload of [target.parentPayload, target.studentPayload]) {
        expect(payload.data).toMatchObject({
          attendanceId: '1',
          sessionId: '7',
          studentId: '100',
          event: moment,
          destinationType: NotificationDestinationType.SCHEDULE_SESSION,
          resourceId: 7,
        })
      }
    },
  )

  it('không có bản ghi vắng thì không xếp hàng', async () => {
    const { queue, service } = setup()

    expect(await service.enqueueSessionMoment(repos, session, 'ABSENCE_SUMMARY', [])).toBe(0)
    expect(queue.enqueueStudentAndParentsWithRepos).not.toHaveBeenCalled()
  })

  it('outbox không tạo được thì trả 0', async () => {
    const { service } = setup(null)

    expect(await service.enqueueSessionMoment(repos, session, 'ABSENCE_SUMMARY', [attendance(1, 100)])).toBe(0)
  })
})

describe('AttendanceNotificationService.enqueueAttendanceEvent', () => {
  it('ARRIVED: chỉ phụ huynh (không có studentPayload), kèm học bù và idempotencyKey theo markedAt', async () => {
    const { queue, service } = setup()
    const record = attendance(5, 100, { status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP })

    const queued = await service.enqueueAttendanceEvent(repos, record, 'ARRIVED')

    expect(queued).toBe(true)
    const input = queue.enqueueStudentAndParentsWithRepos.mock.calls[0][1]
    expect(input).toMatchObject({
      sourceType: 'ATTENDANCE',
      sourceId: '5',
      sourceEvent: 'ARRIVED',
      idempotencyKey: `attendance:5:ARRIVED:${record.markedAt.getTime()}`,
    })
    expect(input.targets).toHaveLength(1)
    expect(input.targets[0].studentPayload).toBeUndefined()
    expect(input.targets[0].parentPayload.message).toContain('Con đã đến lớp lúc 18:05 (học bù).')
    expect(input.targets[0].zaloPayload).toBeDefined()
  })

  it.each(['ARRIVED', 'STATUS_CHANGED'] as const)(
    '%s: payload trỏ tới chi tiết buổi học (schedule_session) và giữ attendanceId',
    async (event) => {
      const { queue, service } = setup()

      await service.enqueueAttendanceEvent(repos, attendance(5, 100), event)

      const input = queue.enqueueStudentAndParentsWithRepos.mock.calls[0][1]
      expect(input.data).toMatchObject({
        attendanceId: '5',
        sessionId: '7',
        studentId: '100',
        event,
        destinationType: NotificationDestinationType.SCHEDULE_SESSION,
        resourceId: 7,
      })
      expect(input.targets[0].parentPayload.data).toEqual(input.data)
    },
  )

  it('STATUS_CHANGED: nêu trạng thái mới; markedAt khác thì idempotencyKey khác', async () => {
    const { queue, service } = setup()
    const first = attendance(5, 100, { markedAt: new Date('2026-10-14T11:05:00.000Z') })
    const second = attendance(5, 100, { markedAt: new Date('2026-10-14T11:30:00.000Z') })

    await service.enqueueAttendanceEvent(repos, first, 'STATUS_CHANGED')
    await service.enqueueAttendanceEvent(repos, second, 'STATUS_CHANGED')

    const [a, b] = queue.enqueueStudentAndParentsWithRepos.mock.calls.map((call) => call[1])
    expect(a.targets[0].parentPayload.message).toContain('Trạng thái điểm danh đã được cập nhật: Vắng mặt.')
    expect(a.idempotencyKey).not.toBe(b.idempotencyKey)
  })

  it('thiếu classSession thì bỏ qua', async () => {
    const { queue, service } = setup()

    const queued = await service.enqueueAttendanceEvent(
      repos,
      attendance(5, 100, { classSession: undefined }),
      'ARRIVED',
    )

    expect(queued).toBe(false)
    expect(queue.enqueueStudentAndParentsWithRepos).not.toHaveBeenCalled()
  })
})
