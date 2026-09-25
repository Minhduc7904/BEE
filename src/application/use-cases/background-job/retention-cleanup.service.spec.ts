import { ConflictException } from '@nestjs/common'

import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { BackgroundJobCode, BackgroundJobRunStatus } from '../../../shared/enums'
import { RetentionCleanupService, USER_REFRESH_TOKEN_CLEANUP_JOB } from './retention-cleanup.service'

describe('RetentionCleanupService - refresh token cleanup', () => {
  const startedAt = new Date('2026-09-25T03:20:00.000Z')
  const leaseExpiresAt = new Date(startedAt.getTime() + 900_000)
  const upsert = jest.fn()
  const tryAcquire = jest.fn()
  const findLatestByBackgroundJobId = jest.fn()
  const createRun = jest.fn()
  const updateRun = jest.fn()
  const release = jest.fn()
  const deleteExpiredTokens = jest.fn()
  const deleteOlderThan = jest.fn()
  const deleteFinishedBefore = jest.fn()
  const repos = {
    backgroundJobRepository: { upsert },
    adminAuditLogRepository: { deleteOlderThan },
    backgroundJobLockRepository: { tryAcquire, release },
    backgroundJobRunRepository: {
      findLatestByBackgroundJobId,
      create: createRun,
      update: updateRun,
      deleteFinishedBefore,
    },
    userRefreshTokenRepository: { deleteExpiredTokens },
  } as unknown as UnitOfWorkRepos
  const executeInTransaction = jest.fn(async (operation: (transactionRepos: UnitOfWorkRepos) => unknown) =>
    operation(repos),
  )
  const service = new RetentionCleanupService({ executeInTransaction } as unknown as IUnitOfWork)

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(startedAt)
    jest.clearAllMocks()
    upsert.mockResolvedValue({
      backgroundJobId: 15,
      maxRuntimeSeconds: 900,
      canRun: () => true,
    })
    tryAcquire.mockResolvedValue({ leaseExpiresAt })
    findLatestByBackgroundJobId.mockResolvedValue(null)
    createRun.mockResolvedValue({ backgroundJobRunId: 29 })
    updateRun.mockResolvedValue({})
    release.mockResolvedValue(undefined)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('xóa nhiều batch bằng cutoff cố định và ghi kết quả thành công', async () => {
    deleteExpiredTokens.mockResolvedValueOnce(1_000).mockResolvedValueOnce(1_000).mockResolvedValueOnce(25)

    await expect(service.executeUserRefreshTokenCleanup('worker-1')).resolves.toEqual({
      backgroundJobRunId: 29,
      deletedCount: 2_025,
      batchCount: 3,
      batchSize: 1_000,
      cutoffAt: startedAt.toISOString(),
      hasMore: false,
    })

    expect(upsert).toHaveBeenCalledWith(USER_REFRESH_TOKEN_CLEANUP_JOB)
    expect(deleteExpiredTokens).toHaveBeenCalledTimes(3)
    expect(deleteExpiredTokens).toHaveBeenNthCalledWith(1, startedAt, 1_000)
    expect(deleteExpiredTokens).toHaveBeenNthCalledWith(3, startedAt, 1_000)
    expect(updateRun).toHaveBeenCalledWith(
      29,
      expect.objectContaining({
        status: BackgroundJobRunStatus.SUCCEEDED,
        resultSummary: expect.objectContaining({ deletedCount: 2_025, hasMore: false }),
      }),
    )
    expect(release).toHaveBeenCalledWith(15, expect.any(String))
  })

  it('giữ nguyên hành vi cleanup retention hiện có sau khi dùng chung lifecycle', async () => {
    deleteOlderThan.mockResolvedValue(12)
    deleteFinishedBefore.mockResolvedValue(4)

    await expect(service.executeAuditLogCleanup('worker-1')).resolves.toEqual(
      expect.objectContaining({ deletedCount: 12, retentionDays: 30 }),
    )
    await expect(service.executeBackgroundJobRunCleanup('worker-1')).resolves.toEqual(
      expect.objectContaining({ deletedCount: 4, retentionDays: 7 }),
    )

    expect(deleteOlderThan).toHaveBeenCalledWith(new Date(startedAt.getTime() - 30 * 24 * 60 * 60 * 1000))
    expect(deleteFinishedBefore).toHaveBeenCalledWith(new Date(startedAt.getTime() - 7 * 24 * 60 * 60 * 1000))
  })

  it('trả batch rỗng khi không có token hết hạn', async () => {
    deleteExpiredTokens.mockResolvedValue(0)

    await expect(service.executeUserRefreshTokenCleanup('worker-1')).resolves.toEqual(
      expect.objectContaining({
        deletedCount: 0,
        batchCount: 0,
        hasMore: false,
      }),
    )
  })

  it('dừng trước khi lease hết hạn và báo còn dữ liệu', async () => {
    deleteExpiredTokens.mockImplementationOnce(async () => {
      jest.setSystemTime(new Date(leaseExpiresAt.getTime() - 60_000))
      return 1_000
    })

    await expect(service.executeUserRefreshTokenCleanup('worker-1')).resolves.toEqual(
      expect.objectContaining({
        deletedCount: 1_000,
        batchCount: 1,
        hasMore: true,
      }),
    )
    expect(deleteExpiredTokens).toHaveBeenCalledTimes(1)
  })

  it('không chạy cleanup khi job bị tắt', async () => {
    upsert.mockResolvedValue({
      backgroundJobId: 15,
      maxRuntimeSeconds: 900,
      canRun: () => false,
    })

    await expect(service.executeUserRefreshTokenCleanup('worker-1')).resolves.toBeNull()

    expect(tryAcquire).not.toHaveBeenCalled()
    expect(deleteExpiredTokens).not.toHaveBeenCalled()
  })

  it('từ chối worker thứ hai khi không lấy được lock', async () => {
    tryAcquire.mockResolvedValue(null)

    await expect(service.executeUserRefreshTokenCleanup('worker-2')).rejects.toEqual(
      new ConflictException('RETENTION_CLEANUP_ALREADY_RUNNING'),
    )

    expect(deleteExpiredTokens).not.toHaveBeenCalled()
    expect(release).not.toHaveBeenCalled()
  })

  it('ghi FAILED, giải phóng lock và giữ các batch đã commit khi batch sau lỗi', async () => {
    deleteExpiredTokens.mockResolvedValueOnce(1_000).mockRejectedValueOnce(new Error('database unavailable'))

    await expect(service.executeUserRefreshTokenCleanup('worker-1')).rejects.toThrow('database unavailable')

    expect(deleteExpiredTokens).toHaveBeenCalledTimes(2)
    expect(executeInTransaction).toHaveBeenCalledTimes(6)
    expect(updateRun).toHaveBeenCalledWith(
      29,
      expect.objectContaining({
        status: BackgroundJobRunStatus.FAILED,
        errorCode: `${BackgroundJobCode.USER_REFRESH_TOKEN_CLEANUP}_FAILED`,
        errorMessage: 'database unavailable',
      }),
    )
    expect(release).toHaveBeenCalledWith(15, expect.any(String))
  })
})
