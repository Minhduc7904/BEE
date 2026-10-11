import type { IUnitOfWork } from 'src/domain/repositories'
import type { SessionMakeupRegistrationSyncService } from 'src/application/services/session-makeup-registration-sync.service'
import { UpdateClassSessionDto } from 'src/application/dtos/class-session/update-class-session.dto'
import { ClassSession } from 'src/domain/entities/class-session/class-session.entity'
import { UpdateClassSessionUseCase } from './update-class-session.use-case'

const NOW = new Date('2026-10-14T11:20:00.000Z') // 18:20 VN ngày 14/10

// Buổi 18:00-20:00 VN ngày 14/10 (11:00-13:00 UTC), mốc 15 phút đã được đánh dấu
const existing = () =>
  new ClassSession({
    sessionId: 7,
    classId: 10,
    name: 'Buổi 7',
    sessionDate: new Date('2026-10-14T00:00:00.000Z'),
    startTime: new Date('1970-01-01T11:00:00.000Z'),
    endTime: new Date('1970-01-01T13:00:00.000Z'),
    absentReminderNotifiedAt: new Date('2026-10-14T11:16:00.000Z'),
    absenceSummaryNotifiedAt: null,
  })

function setup() {
  const repos = {
    classSessionRepository: {
      findById: jest.fn().mockResolvedValue(existing()),
      update: jest.fn().mockResolvedValue(existing()),
    },
    adminAuditLogRepository: { create: jest.fn() },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((work: (r: typeof repos) => unknown) => work(repos)),
  } as unknown as IUnitOfWork
  const sync = { syncForClasses: jest.fn().mockResolvedValue(undefined) }
  const useCase = new UpdateClassSessionUseCase(unitOfWork, sync as unknown as SessionMakeupRegistrationSyncService)
  const run = (dto: Partial<UpdateClassSessionDto>) =>
    useCase.execute(7, Object.assign(new UpdateClassSessionDto(), dto), 1)
  return { repos, run }
}

describe('UpdateClassSessionUseCase đặt lại dấu thông báo điểm danh', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW)
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('dời sang ngày mai: cả hai mốc đều chưa tới nên xóa cả hai dấu', async () => {
    const { repos, run } = setup()

    await run({ sessionDate: '2026-10-15' })

    expect(repos.classSessionRepository.update.mock.calls[0][1]).toMatchObject({
      absentReminderNotifiedAt: null,
      absenceSummaryNotifiedAt: null,
    })
  })

  it('lùi giờ bắt đầu sang 19:00 VN: mốc 19:15 và mốc hết giờ đều chưa tới nên xóa cả hai dấu', async () => {
    const { repos, run } = setup()

    await run({ startTime: '1970-01-01T12:00:00.000Z' })

    expect(repos.classSessionRepository.update.mock.calls[0][1]).toMatchObject({
      absentReminderNotifiedAt: null,
      absenceSummaryNotifiedAt: null,
    })
  })

  it('kéo dài giờ kết thúc: mốc 15 phút đã qua nên giữ dấu, chỉ xóa dấu hết giờ', async () => {
    const { repos, run } = setup()

    await run({ endTime: '1970-01-01T14:00:00.000Z' })

    const data = repos.classSessionRepository.update.mock.calls[0][1]
    expect(data).toHaveProperty('absenceSummaryNotifiedAt', null)
    expect(data.absentReminderNotifiedAt).toBeUndefined()
  })

  it('đổi sang ngày đã qua hết: không xóa dấu nào', async () => {
    const { repos, run } = setup()

    await run({ sessionDate: '2026-10-13' })

    const data = repos.classSessionRepository.update.mock.calls[0][1]
    expect(data.absentReminderNotifiedAt).toBeUndefined()
    expect(data.absenceSummaryNotifiedAt).toBeUndefined()
  })

  it('chỉ đổi tên: không đụng tới dấu', async () => {
    const { repos, run } = setup()

    await run({ name: 'Tên mới' })

    const data = repos.classSessionRepository.update.mock.calls[0][1]
    expect(data).not.toHaveProperty('absentReminderNotifiedAt')
    expect(data).not.toHaveProperty('absenceSummaryNotifiedAt')
  })
})
