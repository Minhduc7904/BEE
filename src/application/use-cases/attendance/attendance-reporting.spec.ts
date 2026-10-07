import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import { AttendanceStatus, AttendanceType } from '../../../shared/enums'
import { AttendanceParentMessageTemplate } from '../../../infrastructure/templates/attendance-parent-message.template'
import { GetAttendanceStatisticsBySessionUseCase } from './get-attendance-statistics-by-session.use-case'
import { ExportAttendanceBySessionUseCase } from './export-attendance-by-session.use-case'
import { ExportCourseStudentsAttendanceUseCase } from '../course/export-course-students-attendance.use-case'
import { SendAttendanceToParentUseCase } from './send-attendance-to-parent.use-case'
import type { UnitOfWorkRepos } from '../../../domain/repositories'

function attendance(id: number, status: AttendanceStatus, attendanceType: AttendanceType) {
  return new Attendance({ attendanceId: id, sessionId: 1, studentId: id, status, attendanceType })
}

describe('thống kê điểm danh theo buổi', () => {
  it('đếm học bù theo attendanceType, không nhầm với status', async () => {
    const rows = [
      attendance(1, AttendanceStatus.PRESENT, AttendanceType.REGULAR),
      attendance(2, AttendanceStatus.PRESENT, AttendanceType.MAKEUP),
      attendance(3, AttendanceStatus.ABSENT, AttendanceType.MAKEUP),
      attendance(4, AttendanceStatus.LATE, AttendanceType.REGULAR),
    ]
    const useCase = new GetAttendanceStatisticsBySessionUseCase({
      findAllWithPagination: jest.fn().mockResolvedValue({ data: rows, total: rows.length }),
    } as never)

    const result = await useCase.execute(1)

    expect(result.data).toMatchObject({ total: 4, present: 2, absent: 1, late: 1, makeup: 2 })
  })
})

describe('export điểm danh', () => {
  it('export theo buổi có cột loại điểm danh với label đúng', async () => {
    const rows = [
      attendance(1, AttendanceStatus.PRESENT, AttendanceType.MAKEUP),
      attendance(2, AttendanceStatus.PRESENT, AttendanceType.REGULAR),
    ]
    const exportToBuffer = jest.fn().mockResolvedValue(Buffer.from('x'))
    const useCase = new ExportAttendanceBySessionUseCase(
      { findAllWithPagination: jest.fn().mockResolvedValue({ data: rows, total: 2 }) } as never,
      {} as never,
      { exportToBuffer } as never,
    )

    await useCase.execute(1)

    const { columns, data } = exportToBuffer.mock.calls[0][0]
    expect(columns.map((column: { key: string }) => column.key)).toEqual(
      expect.arrayContaining(['status', 'attendanceType']),
    )
    expect(columns.find((column: { key: string }) => column.key === 'attendanceType').header).toBe('Loại điểm danh')
    expect(data.map((row: { status: string; attendanceType: string }) => [row.status, row.attendanceType])).toEqual([
      ['Có mặt', 'Học bù'],
      ['Có mặt', 'Chính khóa'],
    ])
  })

  it('export theo khóa học đếm học bù theo attendanceType', async () => {
    const exportToBuffer = jest.fn().mockResolvedValue(Buffer.from('x'))
    const useCase = new ExportCourseStudentsAttendanceUseCase(
      {
        findById: jest.fn().mockResolvedValue({ title: 'Toan' }),
        findStudentsWithAttendance: jest.fn().mockResolvedValue({
          total: 1,
          students: [
            {
              student: { studentId: 7, user: { firstName: 'An', lastName: 'Nguyen' } },
              attendances: [
                attendance(1, AttendanceStatus.PRESENT, AttendanceType.MAKEUP),
                attendance(2, AttendanceStatus.ABSENT, AttendanceType.MAKEUP),
                attendance(3, AttendanceStatus.LATE, AttendanceType.REGULAR),
              ],
            },
          ],
        }),
      } as never,
      { exportToBuffer } as never,
    )

    await useCase.execute(1, { toFilterOptions: () => ({ fromDate: new Date(), toDate: new Date() }) } as never)

    const { columns, data } = exportToBuffer.mock.calls[0][0]
    expect(data[0]).toMatchObject({ presentCount: 1, absentCount: 1, lateCount: 1, makeupCount: 2 })
    expect(columns.find((column: { key: string }) => column.key === 'makeupCount').header).toBe('Học bù')
  })
})

describe('thông báo phụ huynh về điểm danh', () => {
  function setup(row: Attendance) {
    const enqueue = jest.fn().mockResolvedValue({ id: 1 })
    const repos = {
      attendanceRepository: { findById: jest.fn().mockResolvedValue(row) },
      homeworkSubmitRepository: { findByHomeworkAndStudent: jest.fn() },
    } as unknown as UnitOfWorkRepos
    const useCase = new SendAttendanceToParentUseCase({} as never, { enqueueStudentAndParentsWithRepos: enqueue } as never)
    return { enqueue, repos, useCase }
  }

  it('hiển thị đúng trạng thái và loại học bù', async () => {
    const { enqueue, repos, useCase } = setup(attendance(5, AttendanceStatus.PRESENT, AttendanceType.MAKEUP))

    const result = await useCase.executeWithRepos(repos, { attendanceId: 5 })

    expect(result.messageText).toContain('TRẠNG THÁI: Có mặt')
    expect(result.messageText).toContain('LOẠI ĐIỂM DANH: Học bù')
    expect(enqueue.mock.calls[0][1].data).toMatchObject({ status: 'PRESENT', attendanceType: 'MAKEUP' })
  })

  it('điểm danh thường không có dòng loại', async () => {
    const { repos, useCase } = setup(attendance(5, AttendanceStatus.PRESENT, AttendanceType.REGULAR))

    const result = await useCase.executeWithRepos(repos, { attendanceId: 5 })

    expect(result.messageText).not.toContain('LOẠI ĐIỂM DANH')
  })

  it('cùng dữ liệu thì idempotency key không đổi (không gửi lặp), đổi loại thì khóa mới', async () => {
    const regular = setup(attendance(5, AttendanceStatus.PRESENT, AttendanceType.REGULAR))
    await regular.useCase.executeWithRepos(regular.repos, { attendanceId: 5 })
    await regular.useCase.executeWithRepos(regular.repos, { attendanceId: 5 })
    const makeup = setup(attendance(5, AttendanceStatus.PRESENT, AttendanceType.MAKEUP))
    await makeup.useCase.executeWithRepos(makeup.repos, { attendanceId: 5 })

    const [first, second] = regular.enqueue.mock.calls.map(([, payload]) => payload.idempotencyKey)
    expect(first).toBe(second)
    expect(makeup.enqueue.mock.calls[0][1].idempotencyKey).not.toBe(first)
  })

  it('template chỉ thêm dòng loại khi có label', () => {
    const base = {
      studentName: 'An',
      className: '10A',
      sessionDate: '01/01',
      attendanceTimeLabel: 'T',
      arrivalTime: '08:00',
      statusLabel: 'Có mặt',
    }
    expect(AttendanceParentMessageTemplate.render(base)).not.toContain('LOẠI')
    expect(AttendanceParentMessageTemplate.render({ ...base, attendanceTypeLabel: 'Học bù' })).toContain('Học bù')
  })
})
