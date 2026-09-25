import { RetentionCleanupService } from '../../application/use-cases/background-job'
import { RetentionCleanupScheduler } from './retention-cleanup.scheduler'

describe('RetentionCleanupScheduler', () => {
  const executeUserRefreshTokenCleanup = jest.fn()
  const service = { executeUserRefreshTokenCleanup } as unknown as RetentionCleanupService
  const scheduler = new RetentionCleanupScheduler(service)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('chạy job dọn refresh token với worker id ổn định', async () => {
    executeUserRefreshTokenCleanup.mockResolvedValue({
      backgroundJobRunId: 29,
      deletedCount: 10,
      batchCount: 1,
      batchSize: 1_000,
      cutoffAt: '2026-09-25T03:20:00.000Z',
      hasMore: false,
    })

    await scheduler.cleanUserRefreshTokens()

    expect(executeUserRefreshTokenCleanup).toHaveBeenCalledWith('SCHEDULER:USER_REFRESH_TOKEN_CLEANUP')
  })
})
