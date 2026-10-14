import type { AuthenticatedUser, ParentStudentDashboardReadService } from '../../interfaces'
import { ParentMonthQueryDto } from '../../dtos/parent-student-dashboard'
import { GetParentStudentAttendanceSummaryUseCase } from '.'

const parentIdentity: AuthenticatedUser = {
  userId: 10,
  username: 'parent-test',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

function query(month: number, year: number): ParentMonthQueryDto {
  const dto = new ParentMonthQueryDto()
  dto.month = month
  dto.year = year
  return dto
}

function service(counts = { present: 0, absent: 0, late: 0, makeup: 0 }, linked = true) {
  return {
    isStudentLinked: jest.fn().mockResolvedValue(linked),
    countAttendanceByStatus: jest.fn().mockResolvedValue(counts),
  } as unknown as jest.Mocked<ParentStudentDashboardReadService>
}

describe('GetParentStudentAttendanceSummaryUseCase', () => {
  it('rejects a parent that is not linked to the student before counting', async () => {
    const reader = service(undefined, false)

    await expect(
      new GetParentStudentAttendanceSummaryUseCase(reader).execute(parentIdentity, 99, query(10, 2026)),
    ).rejects.toHaveProperty('name', 'ForbiddenException')

    expect(reader.isStudentLinked).toHaveBeenCalledWith(20, 99)
    expect(reader.countAttendanceByStatus).not.toHaveBeenCalled()
  })

  it.each([
    ['student', { userType: 'student', studentId: 99 } as Partial<AuthenticatedUser>],
    ['admin', { userType: 'admin', adminId: 1 } as Partial<AuthenticatedUser>],
    ['parent without parentId', { parentId: undefined } as Partial<AuthenticatedUser>],
  ])('rejects %s identity', async (_, override) => {
    const reader = service()

    await expect(
      new GetParentStudentAttendanceSummaryUseCase(reader).execute(
        { ...parentIdentity, ...override },
        99,
        query(10, 2026),
      ),
    ).rejects.toHaveProperty('name', 'ForbiddenException')
    expect(reader.isStudentLinked).not.toHaveBeenCalled()
    expect(reader.countAttendanceByStatus).not.toHaveBeenCalled()
  })

  it('derives total and rate from the three statuses and keeps makeup as a separate subset', async () => {
    const reader = service({ present: 8, absent: 2, late: 1, makeup: 1 })

    const result = await new GetParentStudentAttendanceSummaryUseCase(reader).execute(
      parentIdentity,
      12,
      query(10, 2026),
    )

    expect(result).toEqual({
      success: true,
      message: 'Lấy thống kê điểm danh thành công',
      data: {
        month: 10,
        year: 2026,
        total: 11,
        present: 8,
        absent: 2,
        late: 1,
        makeup: 1,
        attended: 9,
        attendanceRate: 81.82,
      },
    })
  })

  it('returns zero counts and rate for an empty month instead of treating it as absent', async () => {
    const reader = service()

    const result = await new GetParentStudentAttendanceSummaryUseCase(reader).execute(
      parentIdentity,
      12,
      query(11, 2026),
    )

    expect(result.data).toEqual({
      month: 11,
      year: 2026,
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      makeup: 0,
      attended: 0,
      attendanceRate: 0,
    })
  })

  it('rounds the rate to two decimals', async () => {
    const reader = service({ present: 2, absent: 1, late: 0, makeup: 0 })

    const result = await new GetParentStudentAttendanceSummaryUseCase(reader).execute(
      parentIdentity,
      12,
      query(10, 2026),
    )

    expect(result.data?.attendanceRate).toBe(66.67)
  })

  it('queries the calendar-month bounds of the requested month (date-only, end exclusive)', async () => {
    const reader = service()

    await new GetParentStudentAttendanceSummaryUseCase(reader).execute(parentIdentity, 12, query(12, 2026))

    expect(reader.countAttendanceByStatus).toHaveBeenCalledWith(
      12,
      new Date('2026-12-01T00:00:00.000Z'),
      new Date('2027-01-01T00:00:00.000Z'),
    )
  })

  it('does not double-count LATE + MAKEUP or a made-up ABSENT record', async () => {
    // 1 PRESENT(REGULAR), 1 LATE(MAKEUP), 1 PRESENT(MAKEUP), 1 ABSENT that was made up by another record
    const reader = service({ present: 2, absent: 1, late: 1, makeup: 2 })

    const result = await new GetParentStudentAttendanceSummaryUseCase(reader).execute(
      parentIdentity,
      12,
      query(10, 2026),
    )

    expect(result.data).toMatchObject({ total: 4, attended: 3, makeup: 2, attendanceRate: 75 })
  })

  it('never exceeds a 100% rate when every record is a makeup record', async () => {
    const reader = service({ present: 3, absent: 0, late: 1, makeup: 4 })

    const result = await new GetParentStudentAttendanceSummaryUseCase(reader).execute(
      parentIdentity,
      12,
      query(10, 2026),
    )

    expect(result.data).toMatchObject({ total: 4, attended: 4, makeup: 4, attendanceRate: 100 })
  })
})
