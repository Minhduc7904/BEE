/* eslint-disable @typescript-eslint/require-await -- in-memory fakes mimic async repository signatures */
import { ConflictException } from '@nestjs/common'
import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import { ClassSession } from '../../../domain/entities/class-session/class-session.entity'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ClassSessionNotificationMoment } from '../../../domain/interface/class-session/class-session.interface'
import { AttendanceStatus } from '../../../shared/enums'
import { SendSessionAttendanceNotificationsUseCase } from './send-session-attendance-notifications.use-case'

// Buổi 18:00-20:00 giờ VN ngày 14/10/2026: mốc 15 phút = 11:15Z, mốc hết giờ = 13:00Z
const TODAY = '2026-10-14'
const BEFORE_REMINDER = new Date('2026-10-14T11:10:00.000Z')
const AFTER_REMINDER = new Date('2026-10-14T11:20:00.000Z')
const AFTER_END = new Date('2026-10-14T13:05:00.000Z')

function makeSession(id: number, overrides: Partial<ConstructorParameters<typeof ClassSession>[0]> = {}) {
  return new ClassSession({
    sessionId: id,
    classId: 10,
    name: `Buổi ${id}`,
    sessionDate: new Date(`${TODAY}T00:00:00.000Z`),
    startTime: new Date('1970-01-01T11:00:00.000Z'),
    endTime: new Date('1970-01-01T13:00:00.000Z'),
    ...overrides,
  })
}

function makeAbsence(attendanceId: number, sessionId: number) {
  return new Attendance({
    attendanceId,
    sessionId,
    studentId: 100 + attendanceId,
    status: AttendanceStatus.ABSENT,
  })
}

interface SetupOptions {
  sessions: ClassSession[]
  /** Bản ghi vắng chưa bù theo sessionId. */
  absences?: Record<number, Attendance[]>
  canRun?: boolean
  lockAcquired?: boolean
}

function setup(options: SetupOptions) {
  // Dấu đã claim, mô phỏng cập nhật có điều kiện (cột đang null)
  const claimed = new Map<string, boolean>()
  options.sessions.forEach((session) => {
    if (session.absentReminderNotifiedAt) claimed.set(`${session.sessionId}:ABSENT_REMINDER`, true)
    if (session.absenceSummaryNotifiedAt) claimed.set(`${session.sessionId}:ABSENCE_SUMMARY`, true)
  })

  const classSessionRepository = {
    findForAttendanceNotification: jest.fn(async () => options.sessions),
    claimNotificationMoment: jest.fn(async (sessionId: number, moment: ClassSessionNotificationMoment) => {
      const key = `${sessionId}:${moment}`
      if (claimed.get(key)) return false
      claimed.set(key, true)
      return true
    }),
  }
  const attendanceRepository = {
    findUnmadeUpAbsencesBySession: jest.fn(async (sessionId: number) => options.absences?.[sessionId] ?? []),
  }
  const backgroundJobRunRepository = {
    findLatestByBackgroundJobId: jest.fn(async () => null),
    create: jest.fn(async () => ({ backgroundJobRunId: 55 })),
    update: jest.fn(async () => undefined),
  }
  const backgroundJobLockRepository = {
    tryAcquire: jest.fn(async () => (options.lockAcquired === false ? null : { leaseExpiresAt: new Date() })),
    release: jest.fn(async () => undefined),
  }
  const repos = {
    classSessionRepository,
    attendanceRepository,
    backgroundJobRunRepository,
    backgroundJobLockRepository,
    backgroundJobRepository: {
      upsert: jest.fn(async () => ({
        backgroundJobId: 3,
        maxRuntimeSeconds: 120,
        canRun: () => options.canRun !== false,
      })),
    },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((work: (r: typeof repos) => Promise<unknown>) => work(repos)),
  } as unknown as IUnitOfWork
  const notification = {
    enqueueSessionMoment: jest.fn(
      async (_repos: unknown, _session: ClassSession, _moment: string, list: Attendance[]) => list.length,
    ),
  }
  const useCase = new SendSessionAttendanceNotificationsUseCase(unitOfWork, notification as never)
  return {
    useCase,
    repos,
    classSessionRepository,
    attendanceRepository,
    notification,
    backgroundJobRunRepository,
    backgroundJobLockRepository,
  }
}

describe('SendSessionAttendanceNotificationsUseCase', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  const at = (now: Date) => jest.useFakeTimers().setSystemTime(now)

  it('chỉ quét buổi của hôm nay (giờ VN)', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({ sessions: [] })

    await ctx.useCase.executeScheduled('w1')

    expect(ctx.classSessionRepository.findForAttendanceNotification).toHaveBeenCalledWith(
      new Date(`${TODAY}T00:00:00.000Z`),
    )
  })

  it('chưa tới mốc 15 phút: không có gì đến hạn nên không upsert, không lock, không tạo run, không claim', async () => {
    at(BEFORE_REMINDER)
    const ctx = setup({ sessions: [makeSession(1)], absences: { 1: [makeAbsence(1, 1)] } })

    const result = await ctx.useCase.executeScheduled('w1')

    expect(ctx.classSessionRepository.claimNotificationMoment).not.toHaveBeenCalled()
    expect(ctx.notification.enqueueSessionMoment).not.toHaveBeenCalled()
    expect(result).toBeNull()
    expect(ctx.repos.backgroundJobRepository.upsert).not.toHaveBeenCalled()
    expect(ctx.backgroundJobLockRepository.tryAcquire).not.toHaveBeenCalled()
    expect(ctx.backgroundJobRunRepository.create).not.toHaveBeenCalled()
  })

  it('tới mốc 15 phút: claim và gửi tin chưa đến lớp cho học sinh vắng chưa bù', async () => {
    at(AFTER_REMINDER)
    const absences = [makeAbsence(1, 1), makeAbsence(2, 1)]
    const ctx = setup({ sessions: [makeSession(1)], absences: { 1: absences } })

    const result = await ctx.useCase.executeScheduled('w1')

    expect(ctx.classSessionRepository.claimNotificationMoment).toHaveBeenCalledTimes(1)
    expect(ctx.classSessionRepository.claimNotificationMoment).toHaveBeenCalledWith(
      1,
      'ABSENT_REMINDER',
      AFTER_REMINDER,
    )
    expect(ctx.notification.enqueueSessionMoment).toHaveBeenCalledWith(
      ctx.repos,
      expect.objectContaining({ sessionId: 1 }),
      'ABSENT_REMINDER',
      absences,
    )
    expect(result).toMatchObject({ backgroundJobRunId: 55, sessions: 1, reminders: 1, summaries: 0, recipients: 2 })
  })

  it('gửi bù trong ngày: mốc 15 phút đã qua mà chưa gửi thì gửi ở lần quét sau, và chỉ gửi một lần', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({ sessions: [makeSession(1)], absences: { 1: [makeAbsence(1, 1)] } })

    await ctx.useCase.executeScheduled('w1')
    await ctx.useCase.executeScheduled('w2')

    // Lần 2: repository fake trả lại cùng danh sách buổi nhưng claim trùng bị từ chối
    expect(ctx.notification.enqueueSessionMoment).toHaveBeenCalledTimes(1)
  })

  it('qua cả hai mốc mà chưa gửi lần nào: claim cả hai nhưng chỉ gửi tin vắng', async () => {
    at(AFTER_END)
    const absences = [makeAbsence(1, 1)]
    const ctx = setup({ sessions: [makeSession(1)], absences: { 1: absences } })

    const result = await ctx.useCase.executeScheduled('w1')

    expect(ctx.classSessionRepository.claimNotificationMoment).toHaveBeenCalledTimes(2)
    expect(ctx.notification.enqueueSessionMoment).toHaveBeenCalledTimes(1)
    expect(ctx.notification.enqueueSessionMoment).toHaveBeenCalledWith(
      ctx.repos,
      expect.anything(),
      'ABSENCE_SUMMARY',
      absences,
    )
    expect(result).toMatchObject({ reminders: 0, summaries: 1, recipients: 1 })
  })

  it('đã gửi mốc 15 phút, tới hết giờ: chỉ claim và gửi tin vắng', async () => {
    at(AFTER_END)
    const ctx = setup({
      sessions: [makeSession(1, { absentReminderNotifiedAt: AFTER_REMINDER })],
      absences: { 1: [makeAbsence(1, 1)] },
    })

    await ctx.useCase.executeScheduled('w1')

    expect(ctx.classSessionRepository.claimNotificationMoment).toHaveBeenCalledTimes(1)
    expect(ctx.classSessionRepository.claimNotificationMoment).toHaveBeenCalledWith(1, 'ABSENCE_SUMMARY', AFTER_END)
    expect(ctx.notification.enqueueSessionMoment).toHaveBeenCalledWith(
      ctx.repos,
      expect.anything(),
      'ABSENCE_SUMMARY',
      expect.anything(),
    )
  })

  it('claim trùng (worker khác đã xử lý): bỏ qua, không gửi', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({ sessions: [makeSession(1)], absences: { 1: [makeAbsence(1, 1)] } })
    ctx.classSessionRepository.claimNotificationMoment.mockResolvedValue(false)

    const result = await ctx.useCase.executeScheduled('w1')

    expect(ctx.attendanceRepository.findUnmadeUpAbsencesBySession).not.toHaveBeenCalled()
    expect(ctx.notification.enqueueSessionMoment).not.toHaveBeenCalled()
    expect(result).toMatchObject({ sessions: 0, reminders: 0, recipients: 0 })
  })

  it('buổi không có học sinh vắng chưa bù: vẫn đánh dấu mốc nhưng không enqueue', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({ sessions: [makeSession(1)], absences: { 1: [] } })

    const result = await ctx.useCase.executeScheduled('w1')

    expect(ctx.classSessionRepository.claimNotificationMoment).toHaveBeenCalledWith(
      1,
      'ABSENT_REMINDER',
      AFTER_REMINDER,
    )
    expect(ctx.notification.enqueueSessionMoment).not.toHaveBeenCalled()
    expect(result).toMatchObject({ sessions: 1, reminders: 1, recipients: 0 })
  })

  it('chỉ lấy bản ghi vắng chưa bù từ repository (loại PRESENT/LATE/đã bù do truy vấn)', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({ sessions: [makeSession(1)], absences: { 1: [makeAbsence(1, 1)] } })

    await ctx.useCase.executeScheduled('w1')

    expect(ctx.attendanceRepository.findUnmadeUpAbsencesBySession).toHaveBeenCalledWith(1)
  })

  it('lỗi ở một buổi không chặn buổi khác và được đếm vào failed', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({
      sessions: [makeSession(1), makeSession(2)],
      absences: { 1: [makeAbsence(1, 1)], 2: [makeAbsence(2, 2)] },
    })
    ctx.notification.enqueueSessionMoment.mockImplementation(async (_repos, session, _moment, list) => {
      if (session.sessionId === 1) throw new Error('boom')
      return list.length
    })

    const result = await ctx.useCase.executeScheduled('w1')

    expect(ctx.notification.enqueueSessionMoment).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({ sessions: 1, reminders: 1, recipients: 1, failed: 1 })
    expect(ctx.backgroundJobRunRepository.update).toHaveBeenCalledWith(
      55,
      expect.objectContaining({ status: 'SUCCEEDED' }),
    )
  })

  it('job bị tắt thì không chạy', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({ sessions: [makeSession(1)], canRun: false })

    expect(await ctx.useCase.executeScheduled('w1')).toBeNull()
    expect(ctx.backgroundJobLockRepository.tryAcquire).not.toHaveBeenCalled()
    expect(ctx.classSessionRepository.claimNotificationMoment).not.toHaveBeenCalled()
  })

  it('đang có worker khác giữ lock thì ném ATTENDANCE_SESSION_NOTIFIER_ALREADY_RUNNING', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({ sessions: [makeSession(1)], lockAcquired: false })

    await expect(ctx.useCase.executeScheduled('w1')).rejects.toThrow(
      new ConflictException('ATTENDANCE_SESSION_NOTIFIER_ALREADY_RUNNING'),
    )
  })

  it('luôn nhả lock khi chạy xong', async () => {
    at(AFTER_REMINDER)
    const ctx = setup({ sessions: [makeSession(1)] })

    await ctx.useCase.executeScheduled('w1')

    expect(ctx.backgroundJobLockRepository.release).toHaveBeenCalledTimes(1)
  })
})
