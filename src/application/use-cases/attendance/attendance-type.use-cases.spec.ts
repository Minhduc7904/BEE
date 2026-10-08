/* eslint-disable @typescript-eslint/require-await -- in-memory fakes mimic async repository signatures */
import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import type {
  CreateAttendanceData,
  UpdateAttendanceData,
} from '../../../domain/interface/attendance/attendance.interface'
import { AttendanceStatus, AttendanceType } from '../../../shared/enums'
import { PointType } from '../../../shared/enums'
import { StudentPointService } from '../../services/student-point.service'
import { CreateAttendanceDto } from '../../dtos/attendance/create-attendance.dto'
import { UpdateAttendanceDto } from '../../dtos/attendance/update-attendance.dto'
import { CreateBulkAttendanceBySessionDto } from '../../dtos/attendance/create-bulk-attendance-by-session.dto'
import { CreateAttendanceUseCase } from './create-attendance.use-case'
import { UpdateAttendanceUseCase } from './update-attendance.use-case'
import { CreateBulkAttendanceBySessionUseCase } from './create-bulk-attendance-by-session.use-case'

const SESSION_ID = 10
const CLASS_ID = 4
const ADMIN_ID = 1

interface PointLog {
  pointLogId: number
  type: PointType
  points: number
  metadata?: Record<string, unknown>
}

/**
 * In-memory repositories: the use cases are exercised against realistic storage behaviour
 * (create/update/find) and a real StudentPointService, so type/status independence and point
 * idempotency are verified end to end without a database.
 */
function setup(studentIds: number[] = [100]) {
  let nextAttendanceId = 1
  const store = new Map<number, Attendance>()
  const pointLogs = new Map<string, PointLog>()
  let nextPointLogId = 1
  const pointNotifications: unknown[] = []
  const notifications: Array<{ message: string; data: Record<string, unknown> }> = []
  const parentNotifications: number[] = []

  const toEntity = (data: CreateAttendanceData) =>
    new Attendance({
      attendanceId: nextAttendanceId++,
      sessionId: data.sessionId,
      studentId: data.studentId,
      status: data.status,
      attendanceType: data.attendanceType,
      notes: data.notes,
      markerId: data.markerId,
    })

  const attendanceRepository = {
    findById: jest.fn(async (id: number) => store.get(id) ?? null),
    findBySessionAndStudent: jest.fn(async (sessionId: number, studentId: number) =>
      [...store.values()].find((item) => item.sessionId === sessionId && item.studentId === studentId) ?? null,
    ),
    findWithFilter: jest.fn(async () => [] as Attendance[]),
    create: jest.fn(async (data: CreateAttendanceData) => {
      const entity = toEntity(data)
      store.set(entity.attendanceId, entity)
      return entity
    }),
    createBulk: jest.fn(async (items: CreateAttendanceData[]) =>
      items.map((data) => {
        const entity = toEntity(data)
        store.set(entity.attendanceId, entity)
        return entity
      }),
    ),
    update: jest.fn(async (id: number, data: UpdateAttendanceData) => {
      const current = store.get(id)!
      const next = new Attendance({ ...current, ...data })
      store.set(id, next)
      return next
    }),
  }

  const studentPointLogRepository = {
    findByReference: jest.fn(async (studentId: number, source: string, type: string, referenceId: number) =>
      pointLogs.get(`${studentId}:${source}:${type}:${referenceId}`) ?? null,
    ),
    syncByReferenceAndApply: jest.fn(
      async (input: {
        studentId: number
        source: string
        referenceType: string
        referenceId: number
        points: number
        metadata?: Record<string, unknown>
      }) => {
        const key = `${input.studentId}:${input.source}:${input.referenceType}:${input.referenceId}`
        const existing = pointLogs.get(key)
        const log: PointLog = {
          pointLogId: existing?.pointLogId ?? nextPointLogId++,
          type: PointType.BONUS,
          points: input.points,
          metadata: input.metadata,
        }
        pointLogs.set(key, log)
        return log
      },
    ),
  }

  const createAndNotifyOne = {
    executeWithRepos: jest.fn(async (_repos: unknown, notification: { message: string; data: Record<string, unknown> }) => {
      notifications.push(notification)
    }),
  }
  const createAndNotifyMany = {
    executeWithRepos: jest.fn(async (_repos: unknown, list: Array<{ message: string; data: Record<string, unknown> }>) => {
      notifications.push(...list)
    }),
  }
  const sendAttendanceToParent = {
    executeWithRepos: jest.fn(async (_repos: unknown, input: { attendanceId: number }) => {
      parentNotifications.push(input.attendanceId)
    }),
  }
  const sendBulkAttendanceToParent = { executeWithRepos: jest.fn().mockResolvedValue(undefined) }
  const notificationQueue = {
    enqueueInAppWithRepos: jest.fn(async (_repos: unknown, payload: unknown) => {
      pointNotifications.push(payload)
      return {}
    }),
  }

  const repos = {
    attendanceRepository,
    classSessionRepository: {
      findById: jest.fn().mockResolvedValue({
        sessionId: SESSION_ID,
        classId: CLASS_ID,
        courseClass: { course: { isEnded: false } },
      }),
    },
    classStudentRepository: {
      findByClass: jest
        .fn()
        .mockResolvedValue(studentIds.map((studentId) => ({ studentId, student: { userId: studentId + 1000 } }))),
    },
    studentRepository: {
      findById: jest.fn(async (studentId: number) => ({
        studentId,
        userId: studentId + 1000,
        user: { isActive: true },
      })),
    },
    studentPointLogRepository,
    adminAuditLogRepository: { create: jest.fn().mockResolvedValue(undefined) },
  } as unknown as UnitOfWorkRepos

  const unitOfWork = {
    executeInTransaction: (work: (r: UnitOfWorkRepos) => Promise<unknown>) => work(repos),
  } as unknown as IUnitOfWork

  const pointService = new StudentPointService(notificationQueue as never)

  return {
    store,
    pointLogs,
    pointNotifications,
    notifications,
    parentNotifications,
    attendanceRepository,
    sendBulkAttendanceToParent,
    createAndNotifyMany,
    create: new CreateAttendanceUseCase(
      unitOfWork,
      createAndNotifyOne as never,
      sendAttendanceToParent as never,
      pointService,
    ),
    update: new UpdateAttendanceUseCase(
      unitOfWork,
      createAndNotifyOne as never,
      sendAttendanceToParent as never,
      pointService,
    ),
    bulk: new CreateBulkAttendanceBySessionUseCase(
      unitOfWork,
      createAndNotifyMany as never,
      sendBulkAttendanceToParent as never,
      pointService,
    ),
    pointFor: (studentId: number, attendanceId: number) =>
      pointLogs.get(`${studentId}:ATTENDANCE:ATTENDANCE:${attendanceId}`),
  }
}

function createDto(data: Partial<CreateAttendanceDto>): CreateAttendanceDto {
  return Object.assign(new CreateAttendanceDto(), { sessionId: SESSION_ID, studentId: 100, ...data })
}

function updateDto(data: Partial<UpdateAttendanceDto>): UpdateAttendanceDto {
  return Object.assign(new UpdateAttendanceDto(), data)
}

function bulkDto(data: Partial<CreateBulkAttendanceBySessionDto>): CreateBulkAttendanceBySessionDto {
  return Object.assign(new CreateBulkAttendanceBySessionDto(), { sessionId: SESSION_ID, ...data })
}

describe('CreateAttendanceUseCase attendanceType', () => {
  it('ghi REGULAR khi không truyền attendanceType', async () => {
    const ctx = setup()

    const result = await ctx.create.execute(createDto({ status: AttendanceStatus.PRESENT }), 5, ADMIN_ID)

    expect(ctx.attendanceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ attendanceType: AttendanceType.REGULAR }),
    )
    expect(result.data).toMatchObject({
      status: 'PRESENT',
      statusLabel: 'Có mặt',
      attendanceType: 'REGULAR',
    })
  })

  it('lưu MAKEUP và trả label độc lập với status', async () => {
    const ctx = setup()

    const result = await ctx.create.execute(
      createDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }),
      5,
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({
      status: 'PRESENT',
      statusLabel: 'Có mặt',
      attendanceType: 'MAKEUP',
      attendanceTypeLabel: 'Học bù',
    })
    expect([...ctx.store.values()][0].attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('notification học sinh nêu loại học bù và mang attendanceType trong data', async () => {
    const ctx = setup()

    await ctx.create.execute(
      createDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }),
      5,
      ADMIN_ID,
    )

    expect(ctx.notifications[0].message).toContain('Có mặt')
    expect(ctx.notifications[0].message).toContain('Học bù')
    expect(ctx.notifications[0].data).toMatchObject({ status: 'PRESENT', attendanceType: 'MAKEUP' })
  })

  it('metadata điểm chứa attendanceType để Student frontend hiển thị', async () => {
    const ctx = setup()

    await ctx.create.execute(
      createDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }),
      5,
      ADMIN_ID,
    )

    expect(ctx.pointFor(100, 1)?.metadata).toMatchObject({ status: 'PRESENT', attendanceType: 'MAKEUP' })
  })
})

describe('UpdateAttendanceUseCase attendanceType', () => {
  async function created(attendanceType?: AttendanceType, status = AttendanceStatus.PRESENT) {
    const ctx = setup()
    await ctx.create.execute(createDto({ status, attendanceType }), 5, ADMIN_ID)
    ctx.notifications.length = 0
    ctx.parentNotifications.length = 0
    return ctx
  }

  it('chỉ gửi status thì giữ nguyên attendanceType', async () => {
    const ctx = await created(AttendanceType.MAKEUP, AttendanceStatus.PRESENT)

    const result = await ctx.update.execute(1, updateDto({ status: AttendanceStatus.LATE }), 5, ADMIN_ID)

    expect(result.data).toMatchObject({ status: 'LATE', attendanceType: 'MAKEUP' })
    expect(ctx.attendanceRepository.update).toHaveBeenCalledWith(
      1,
      expect.not.objectContaining({ attendanceType: expect.anything() }),
    )
  })

  it('chỉ gửi attendanceType thì giữ nguyên status', async () => {
    const ctx = await created(AttendanceType.REGULAR, AttendanceStatus.LATE)

    const result = await ctx.update.execute(1, updateDto({ attendanceType: AttendanceType.MAKEUP }), 5, ADMIN_ID)

    expect(result.data).toMatchObject({ status: 'LATE', attendanceType: 'MAKEUP' })
    const patch = ctx.attendanceRepository.update.mock.calls[0][1]
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('markedAt')
  })

  it('cập nhật cả hai trường cùng lúc', async () => {
    const ctx = await created(AttendanceType.REGULAR, AttendanceStatus.PRESENT)

    const result = await ctx.update.execute(
      1,
      updateDto({ status: AttendanceStatus.ABSENT, attendanceType: AttendanceType.MAKEUP }),
      5,
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'ABSENT', attendanceType: 'MAKEUP' })
  })

  it('đổi riêng loại điểm danh vẫn thông báo phụ huynh một lần', async () => {
    const ctx = await created(AttendanceType.REGULAR)

    await ctx.update.execute(1, updateDto({ attendanceType: AttendanceType.MAKEUP }), 5, ADMIN_ID)

    expect(ctx.parentNotifications).toEqual([1])
  })

  it('update lặp lại cùng dữ liệu không ghi, không thông báo và không trao điểm lần hai', async () => {
    const ctx = await created(AttendanceType.MAKEUP)
    const pointCallsBefore = ctx.pointNotifications.length

    await ctx.update.execute(1, updateDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }), 5)
    await ctx.update.execute(1, updateDto({ attendanceType: AttendanceType.MAKEUP }), 5)

    expect(ctx.attendanceRepository.update).not.toHaveBeenCalled()
    expect(ctx.notifications).toHaveLength(0)
    expect(ctx.parentNotifications).toHaveLength(0)
    expect(ctx.pointNotifications).toHaveLength(pointCallsBefore)
  })

  it('đổi loại điểm danh không trao điểm thêm cho cùng một buổi', async () => {
    const ctx = await created(AttendanceType.REGULAR, AttendanceStatus.PRESENT)
    expect(ctx.pointNotifications).toHaveLength(1)

    await ctx.update.execute(1, updateDto({ attendanceType: AttendanceType.MAKEUP }), 5)

    expect(ctx.pointNotifications).toHaveLength(1)
    expect(ctx.pointFor(100, 1)).toMatchObject({ points: 1, metadata: { attendanceType: 'MAKEUP' } })
  })
})

describe('điểm thưởng điểm danh theo status, không theo attendanceType', () => {
  it('PRESENT + MAKEUP được tính điểm như PRESENT', async () => {
    const ctx = setup()
    await ctx.create.execute(
      createDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }),
      5,
    )
    const regular = setup()
    await regular.create.execute(createDto({ status: AttendanceStatus.PRESENT }), 5)

    expect(ctx.pointFor(100, 1)?.points).toBe(regular.pointFor(100, 1)?.points)
    expect(ctx.pointFor(100, 1)?.points).toBeGreaterThan(0)
  })

  it('ABSENT + MAKEUP không được tính điểm', async () => {
    const ctx = setup()

    await ctx.create.execute(createDto({ status: AttendanceStatus.ABSENT, attendanceType: AttendanceType.MAKEUP }), 5)

    expect(ctx.pointFor(100, 1)?.points).toBe(0)
    expect(ctx.pointNotifications).toHaveLength(0)
  })

  it('đổi PRESENT sang ABSENT thu hồi điểm, đổi lại PRESENT chỉ trao một lần', async () => {
    const ctx = setup()
    await ctx.create.execute(createDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }), 5)
    await ctx.update.execute(1, updateDto({ status: AttendanceStatus.ABSENT }), 5)
    expect(ctx.pointFor(100, 1)?.points).toBe(0)

    await ctx.update.execute(1, updateDto({ status: AttendanceStatus.PRESENT }), 5)

    expect(ctx.pointFor(100, 1)?.points).toBe(1)
  })
})

describe('CreateBulkAttendanceBySessionUseCase attendanceType', () => {
  it('không truyền type thì tất cả bản ghi là REGULAR', async () => {
    const ctx = setup([100, 101, 102])

    const result = await ctx.bulk.execute(bulkDto({}), 5, ADMIN_ID)

    expect(result.data).toHaveLength(3)
    expect(result.data!.every((item) => item.attendanceType === AttendanceType.REGULAR)).toBe(true)
    expect(result.data!.every((item) => item.status === AttendanceStatus.PRESENT)).toBe(true)
  })

  it('có MAKEUP thì tất cả bản ghi đúng type và status giữ độc lập', async () => {
    const ctx = setup([100, 101])

    const result = await ctx.bulk.execute(
      bulkDto({ status: AttendanceStatus.LATE, attendanceType: AttendanceType.MAKEUP }),
      5,
      ADMIN_ID,
    )

    expect(result.data!.map((item) => [item.status, item.attendanceType])).toEqual([
      ['LATE', 'MAKEUP'],
      ['LATE', 'MAKEUP'],
    ])
    expect(ctx.createAndNotifyMany.executeWithRepos.mock.calls[0][1][0].data).toMatchObject({
      status: 'LATE',
      attendanceType: 'MAKEUP',
    })
  })

  it('bulk gắn attendanceType vào metadata điểm của từng học sinh', async () => {
    const ctx = setup([100, 101])

    await ctx.bulk.execute(bulkDto({ attendanceType: AttendanceType.MAKEUP }), 5, ADMIN_ID)

    expect(ctx.pointFor(100, 1)?.metadata).toMatchObject({ attendanceType: 'MAKEUP' })
    expect(ctx.pointFor(101, 2)?.metadata).toMatchObject({ attendanceType: 'MAKEUP' })
  })
})
