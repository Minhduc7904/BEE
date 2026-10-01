import type { StudentPointLog } from '../../domain/entities'
import type { UnitOfWorkRepos } from '../../domain/repositories'
import { PointType } from '../../shared/enums'
import type { BusinessNotificationQueueService } from '../use-cases/notification/business-notification-queue.service'
import { StudentPointService } from './student-point.service'

describe('StudentPointService transactional notification', () => {
  it('ghi notification outbox bằng cùng UnitOfWorkRepos sau khi cộng điểm', async () => {
    const pointLog = {
      pointLogId: 91,
      type: PointType.BONUS,
      points: 5,
    } as StudentPointLog
    const repos = {
      studentPointLogRepository: {
        createAndApply: jest.fn().mockResolvedValue(pointLog),
      },
      studentRepository: {
        findById: jest.fn().mockResolvedValue({ studentId: 3, userId: 7 }),
      },
    } as unknown as UnitOfWorkRepos
    const enqueueInAppWithRepos = jest.fn().mockResolvedValue({ businessNotificationOutboxId: 1 })
    const service = new StudentPointService({
      enqueueInAppWithRepos,
    } as unknown as BusinessNotificationQueueService)

    await service.createStudentPointLog(repos, {
      studentId: 3,
      type: PointType.BONUS,
      points: 5,
      source: 'MANUAL',
      referenceType: 'MANUAL',
      referenceId: 10,
    })

    expect(enqueueInAppWithRepos).toHaveBeenCalledWith(
      repos,
      [expect.objectContaining({ userId: 7, data: expect.objectContaining({ pointLogId: 91, points: 5 }) })],
      expect.objectContaining({ idempotencyKey: 'point:91:5' }),
    )
  })

  it('lan truyền lỗi ghi outbox để transaction bên ngoài rollback', async () => {
    const pointLog = { pointLogId: 92, type: PointType.BONUS, points: 2 } as StudentPointLog
    const repos = {
      studentPointLogRepository: { createAndApply: jest.fn().mockResolvedValue(pointLog) },
      studentRepository: { findById: jest.fn().mockResolvedValue({ studentId: 3, userId: 7 }) },
    } as unknown as UnitOfWorkRepos
    const service = new StudentPointService({
      enqueueInAppWithRepos: jest.fn().mockRejectedValue(new Error('outbox unavailable')),
    } as unknown as BusinessNotificationQueueService)

    await expect(
      service.createStudentPointLog(repos, {
        studentId: 3,
        type: PointType.BONUS,
        points: 2,
        source: 'MANUAL',
      }),
    ).rejects.toThrow('outbox unavailable')
  })
})
