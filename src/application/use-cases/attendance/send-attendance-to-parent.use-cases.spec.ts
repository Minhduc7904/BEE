import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import { ClassSession } from '../../../domain/entities/class-session/class-session.entity'
import type { UnitOfWorkRepos } from '../../../domain/repositories'
import { AttendanceStatus, NotificationDestinationType } from '../../../shared/enums'
import { SendAttendanceToParentUseCase } from './send-attendance-to-parent.use-case'
import { SendBulkAttendanceToParentUseCase } from './send-bulk-attendance-to-parent.use-case'

const session = new ClassSession({
  sessionId: 7,
  classId: 10,
  name: 'Buổi 7',
  sessionDate: new Date('2026-10-14T00:00:00.000Z'),
  startTime: new Date('1970-01-01T11:00:00.000Z'),
  endTime: new Date('1970-01-01T13:00:00.000Z'),
  courseClass: { className: 'Toán 9A' } as never,
})

const attendance = new Attendance({
  attendanceId: 5,
  sessionId: 7,
  studentId: 100,
  status: AttendanceStatus.ABSENT,
  markedAt: new Date('2026-10-14T11:05:00.000Z'),
  student: {
    studentId: 100,
    userId: 1100,
    parentZaloId: 'zalo-100',
    user: { firstName: 'An', lastName: 'Nguyễn' },
  } as never,
  classSession: session,
})

const repos = {
  attendanceRepository: { findById: jest.fn().mockResolvedValue(attendance) },
  homeworkSubmitRepository: { findByHomeworkAndStudent: jest.fn() },
} as unknown as UnitOfWorkRepos

const expectedData = {
  attendanceId: '5',
  sessionId: '7',
  studentId: '100',
  destinationType: NotificationDestinationType.SCHEDULE_SESSION,
  resourceId: 7,
}

describe('thông báo điểm danh thủ công gửi phụ huynh', () => {
  it('gửi đơn lẻ: payload trỏ tới chi tiết buổi học (schedule_session)', async () => {
    const queue = { enqueueStudentAndParentsWithRepos: jest.fn().mockResolvedValue({ id: 1 }) }
    const useCase = new SendAttendanceToParentUseCase({} as never, queue as never)

    const result = await useCase.executeWithRepos(repos, { attendanceId: 5 })

    expect(result.sent).toBe(true)
    const input = queue.enqueueStudentAndParentsWithRepos.mock.calls[0][1]
    expect(input.data).toMatchObject(expectedData)
    expect(input.targets[0].parentPayload.data).toMatchObject(expectedData)
  })

  it('gửi hàng loạt: mỗi payload trỏ tới chi tiết buổi học (schedule_session)', async () => {
    const queue = { enqueueStudentAndParentsWithRepos: jest.fn().mockResolvedValue({ id: 1 }) }
    const useCase = new SendBulkAttendanceToParentUseCase({} as never, queue as never)

    const result = await useCase.executeWithRepos(repos, { attendanceIds: [5] })

    expect(result.sentCount).toBe(1)
    const input = queue.enqueueStudentAndParentsWithRepos.mock.calls[0][1]
    expect(input.targets[0].parentPayload.data).toMatchObject(expectedData)
  })
})
