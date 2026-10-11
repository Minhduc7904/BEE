import type { IUnitOfWork } from 'src/domain/repositories'
import { CopyBaseAssistantShiftsDto } from 'src/application/dtos'
import { ConflictException, ForbiddenException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import type { SessionMakeupRegistrationSyncService } from 'src/application/services/session-makeup-registration-sync.service'
import { CopyBaseAssistantShiftsBySeriesUseCase } from './copy-base-assistant-shifts-by-series.use-case'

// Ca cơ sở nằm trong tuần mẫu Thứ Hai 20/07/2026 (giờ VN). Thứ Hai 07:00 VN = 00:00 UTC.
const MONDAY_07_00_VN = '2026-07-20T00:00:00.000Z'
const MONDAY_09_00_VN = '2026-07-20T02:00:00.000Z'
const MONDAY_05_00_VN = '2026-07-19T22:00:00.000Z'
const MONDAY_06_00_VN = '2026-07-19T23:00:00.000Z'
const TUESDAY_07_00_VN = '2026-07-21T00:00:00.000Z'
const TUESDAY_09_00_VN = '2026-07-21T02:00:00.000Z'

// Tuần đích: Thứ Hai 12/10/2026 đến Chủ Nhật 18/10/2026 (giờ VN).
const PASTE_START = '2026-10-12T00:00:00+07:00'
const PASTE_END = '2026-10-18T23:59:59+07:00'

type BaseShiftFixture = {
  assistantShiftId: number
  classId: number | null
  start: string
  end: string
}

const baseShift = (fixture: BaseShiftFixture) => ({
  assistantShiftId: fixture.assistantShiftId,
  assistantShiftSeriesId: 1,
  classId: fixture.classId,
  name: `Ca ${fixture.assistantShiftId}`,
  notes: null,
  startAt: new Date(fixture.start),
  endAt: new Date(fixture.end),
  requiredAssistantCount: 1,
  isBaseShift: true,
  assignments: [],
})

const courseClass = (classId: number, isEnded = false) => ({ classId, course: { isEnded } })

function setup(options: {
  shifts: BaseShiftFixture[]
  classes?: Array<{ classId: number; course: { isEnded: boolean } }>
  existingSessions?: Array<{ classId: number; sessionDate: Date; startTime: Date }>
  overlapping?: boolean
}) {
  const shiftsById = new Map(options.shifts.map((shift) => [shift.assistantShiftId, baseShift(shift)]))
  let nextShiftId = 1000
  let nextSessionId = 5000

  const repos = {
    assistantShiftRepository: {
      findById: jest.fn(async (id: number) => shiftsById.get(id) ?? null),
      hasOverlappingTimeRange: jest.fn(async () => options.overlapping ?? false),
      create: jest.fn(async () => ({ assistantShiftId: nextShiftId++ })),
    },
    assistantShiftAssignmentRepository: { create: jest.fn() },
    adminRepository: { findAllByRoleId: jest.fn(async () => []) },
    courseClassRepository: { findByIds: jest.fn(async () => options.classes ?? []) },
    classSessionRepository: {
      findByClassIdsAndSessionDateRange: jest.fn(async () => options.existingSessions ?? []),
      create: jest.fn(async (data: { classId: number; name: string; sessionDate: Date }) => ({
        sessionId: nextSessionId++,
        classId: data.classId,
        name: data.name,
        sessionDate: data.sessionDate,
      })),
    },
    adminAuditLogRepository: { create: jest.fn() },
  }
  const unitOfWork = { executeInTransaction: jest.fn((work: (r: typeof repos) => unknown) => work(repos)) }
  const sessionMakeupRegistrationSync = { syncForClasses: jest.fn(async () => undefined) }
  const useCase = new CopyBaseAssistantShiftsBySeriesUseCase(
    unitOfWork as unknown as IUnitOfWork,
    sessionMakeupRegistrationSync as unknown as SessionMakeupRegistrationSyncService,
  )

  const dtoFor = (ids: number[], createClassSessions?: boolean) =>
    ({
      ids,
      startPasteAt: PASTE_START,
      endPasteAt: PASTE_END,
      ...(createClassSessions === undefined ? {} : { createClassSessions }),
    }) as CopyBaseAssistantShiftsDto

  return { repos, unitOfWork, useCase, dtoFor, sessionMakeupRegistrationSync }
}

const monday = (id: number, classId: number | null, overrides: Partial<BaseShiftFixture> = {}): BaseShiftFixture => ({
  assistantShiftId: id,
  classId,
  start: MONDAY_07_00_VN,
  end: MONDAY_09_00_VN,
  ...overrides,
})

describe('CopyBaseAssistantShiftsBySeriesUseCase - tạo buổi học', () => {
  it('cờ tắt: chỉ copy ca, không đụng tới buổi học và giữ nguyên kết quả cũ', async () => {
    const { repos, useCase, dtoFor } = setup({ shifts: [monday(1, 10)], classes: [courseClass(10)] })

    const response = await useCase.execute(dtoFor([1]), { adminId: 7, canCreateClassSession: true })

    expect(response.data).toEqual({ copiedShiftCount: 1, copiedAssignmentCount: 0 })
    expect(repos.courseClassRepository.findByIds).not.toHaveBeenCalled()
    expect(repos.classSessionRepository.create).not.toHaveBeenCalled()
    expect(repos.adminAuditLogRepository.create).not.toHaveBeenCalled()
  })

  it('cờ bật: tạo buổi "Buổi dd/mm" với giờ lấy từ ca trong tuần đích', async () => {
    const { repos, useCase, dtoFor } = setup({
      shifts: [monday(1, 10), monday(2, 11, { start: TUESDAY_07_00_VN, end: TUESDAY_09_00_VN })],
      classes: [courseClass(10), courseClass(11)],
    })

    const response = await useCase.execute(dtoFor([1, 2], true), { adminId: 7, canCreateClassSession: true })

    expect(response.data).toMatchObject({
      copiedShiftCount: 2,
      createdSessionCount: 2,
      skippedExistingSessionCount: 0,
      skippedNoClassCount: 0,
      skippedEndedCourseCount: 0,
    })
    const created = repos.classSessionRepository.create.mock.calls.map(([data]) => data)
    expect(created).toEqual([
      {
        classId: 10,
        name: 'Buổi 12/10',
        sessionDate: new Date('2026-10-12T00:00:00.000Z'),
        startTime: new Date('2026-10-12T00:00:00.000Z'),
        endTime: new Date('2026-10-12T02:00:00.000Z'),
      },
      {
        classId: 11,
        name: 'Buổi 13/10',
        sessionDate: new Date('2026-10-13T00:00:00.000Z'),
        startTime: new Date('2026-10-13T00:00:00.000Z'),
        endTime: new Date('2026-10-13T02:00:00.000Z'),
      },
    ])
  })

  it('ca 05:00 giờ VN vẫn được gán đúng ngày VN (không lùi một ngày)', async () => {
    const { repos, useCase, dtoFor } = setup({
      shifts: [monday(1, 10, { start: MONDAY_05_00_VN, end: MONDAY_06_00_VN })],
      classes: [courseClass(10)],
    })

    await useCase.execute(dtoFor([1], true), { canCreateClassSession: true })

    expect(repos.classSessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Buổi 12/10',
        sessionDate: new Date('2026-10-12T00:00:00.000Z'),
        startTime: new Date('2026-10-11T22:00:00.000Z'),
      }),
    )
  })

  it('bỏ qua buổi đã có (cùng lớp, ngày, giờ bắt đầu) và báo số buổi bỏ qua', async () => {
    const { repos, useCase, dtoFor } = setup({
      shifts: [monday(1, 10), monday(2, 11)],
      classes: [courseClass(10), courseClass(11)],
      existingSessions: [
        {
          classId: 10,
          sessionDate: new Date('2026-10-12T00:00:00.000Z'),
          startTime: new Date('1970-01-01T00:00:00.000Z'),
        },
      ],
    })

    const response = await useCase.execute(dtoFor([1, 2], true), { canCreateClassSession: true })

    expect(response.data).toMatchObject({ createdSessionCount: 1, skippedExistingSessionCount: 1 })
    expect(repos.classSessionRepository.create).toHaveBeenCalledTimes(1)
    expect(repos.classSessionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ classId: 11 }))
  })

  it('không tạo buổi trùng nhau trong cùng một đợt paste', async () => {
    const { repos, useCase, dtoFor } = setup({
      shifts: [monday(1, 10), monday(2, 10)],
      classes: [courseClass(10)],
    })

    const response = await useCase.execute(dtoFor([1, 2], true), { canCreateClassSession: true })

    expect(response.data).toMatchObject({ createdSessionCount: 1, skippedExistingSessionCount: 1 })
    expect(repos.classSessionRepository.create).toHaveBeenCalledTimes(1)
  })

  it('ca chưa gắn lớp không tạo buổi và được đếm riêng', async () => {
    const { repos, useCase, dtoFor } = setup({ shifts: [monday(1, null)], classes: [] })

    const response = await useCase.execute(dtoFor([1], true), { canCreateClassSession: true })

    expect(response.data).toMatchObject({ copiedShiftCount: 1, createdSessionCount: 0, skippedNoClassCount: 1 })
    expect(repos.classSessionRepository.create).not.toHaveBeenCalled()
  })

  it('khóa học đã kết thúc: bỏ qua buổi nhưng vẫn copy ca', async () => {
    const { repos, useCase, dtoFor } = setup({
      shifts: [monday(1, 10), monday(2, 11)],
      classes: [courseClass(10, true), courseClass(11)],
    })

    const response = await useCase.execute(dtoFor([1, 2], true), { canCreateClassSession: true })

    expect(response.data).toMatchObject({
      copiedShiftCount: 2,
      createdSessionCount: 1,
      skippedEndedCourseCount: 1,
    })
    expect(repos.classSessionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ classId: 11 }))
  })

  it('lớp không còn tồn tại thì báo NotFound và không tạo gì', async () => {
    const { useCase, dtoFor } = setup({ shifts: [monday(1, 10)], classes: [] })

    await expect(useCase.execute(dtoFor([1], true), { canCreateClassSession: true })).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('thiếu quyền class-session:create: từ chối ngay, chưa mở transaction', async () => {
    const { unitOfWork, useCase, dtoFor } = setup({ shifts: [monday(1, 10)], classes: [courseClass(10)] })

    await expect(
      useCase.execute(dtoFor([1], true), { adminId: 7, canCreateClassSession: false }),
    ).rejects.toBeInstanceOf(ForbiddenException)
    await expect(useCase.execute(dtoFor([1], true))).rejects.toBeInstanceOf(ForbiddenException)
    expect(unitOfWork.executeInTransaction).not.toHaveBeenCalled()
  })

  it('thiếu quyền nhưng cờ tắt: vẫn copy ca bình thường', async () => {
    const { useCase, dtoFor } = setup({ shifts: [monday(1, 10)], classes: [courseClass(10)] })

    const response = await useCase.execute(dtoFor([1]), { canCreateClassSession: false })

    expect(response.data).toEqual({ copiedShiftCount: 1, copiedAssignmentCount: 0 })
  })

  it('ghi audit log CREATE_CLASS_SESSION cho từng buổi khi có adminId', async () => {
    const { repos, useCase, dtoFor } = setup({ shifts: [monday(1, 10)], classes: [courseClass(10)] })

    await useCase.execute(dtoFor([1], true), { adminId: 7, canCreateClassSession: true })

    expect(repos.adminAuditLogRepository.create).toHaveBeenCalledTimes(1)
    expect(repos.adminAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 7, resourceType: 'CLASS_SESSION', resourceId: '5000' }),
    )
  })

  it('ca trùng thời gian ở tuần đích: báo Conflict và không tạo buổi nào', async () => {
    const { repos, useCase, dtoFor } = setup({
      shifts: [monday(1, 10)],
      classes: [courseClass(10)],
      overlapping: true,
    })

    await expect(useCase.execute(dtoFor([1], true), { canCreateClassSession: true })).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(repos.classSessionRepository.create).not.toHaveBeenCalled()
    expect(repos.assistantShiftRepository.create).not.toHaveBeenCalled()
  })
})

describe('CopyBaseAssistantShiftsBySeriesUseCase - đồng bộ cặp buổi học bù', () => {
  it('có buổi mới được tạo: đồng bộ cặp học bù cho các lớp đó trong đúng tuần đích', async () => {
    const { useCase, dtoFor, sessionMakeupRegistrationSync } = setup({
      shifts: [monday(1, 10), monday(2, 11, { start: TUESDAY_07_00_VN, end: TUESDAY_09_00_VN })],
      classes: [courseClass(10), courseClass(11)],
    })

    await useCase.execute(dtoFor([1, 2], true), { adminId: 7, canCreateClassSession: true })

    expect(sessionMakeupRegistrationSync.syncForClasses).toHaveBeenCalledTimes(1)
    const [, params] = sessionMakeupRegistrationSync.syncForClasses.mock.calls[0] as unknown as [
      unknown,
      { classIds: number[]; range: { from: Date; to: Date } },
    ]
    expect([...params.classIds].sort((a, b) => a - b)).toEqual([10, 11])
    expect(params.range.from.toISOString()).toBe('2026-10-12T00:00:00.000Z')
    expect(params.range.to.toISOString()).toBe('2026-10-13T00:00:00.000Z')
  })

  it('cờ tắt hoặc không tạo thêm buổi nào: không đồng bộ cặp học bù', async () => {
    const off = setup({ shifts: [monday(1, 10)], classes: [courseClass(10)] })
    await off.useCase.execute(off.dtoFor([1]), { adminId: 7, canCreateClassSession: true })
    expect(off.sessionMakeupRegistrationSync.syncForClasses).not.toHaveBeenCalled()

    const noClass = setup({ shifts: [monday(1, null)] })
    await noClass.useCase.execute(noClass.dtoFor([1], true), { adminId: 7, canCreateClassSession: true })
    expect(noClass.sessionMakeupRegistrationSync.syncForClasses).not.toHaveBeenCalled()
  })
})
