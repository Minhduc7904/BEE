import type { Request, Response } from 'express'
import { ParentPasswordRecoveryController } from './parent-password-recovery.controller'
import { RecoveryRateLimitService } from '../services/recovery-rate-limit.service'

describe('ParentPasswordRecoveryController', () => {
  it('trả 429 và Retry-After khi endpoint students vượt ngưỡng', async () => {
    const getStudentsUseCase = {
      execute: jest.fn().mockResolvedValue({ success: true, data: { students: [] } }),
    }
    const controller = new ParentPasswordRecoveryController(
      getStudentsUseCase as never,
      {} as never,
      {} as never,
      new RecoveryRateLimitService(),
    )
    const request = { ip: '127.0.0.1' } as Request
    const response = { setHeader: jest.fn() } as unknown as Response
    const dto = { phone: '0392923661' }

    for (let index = 0; index < 5; index += 1) {
      await expect(controller.getStudents(dto, request, response)).resolves.toMatchObject({ success: true })
    }

    await expect(controller.getStudents(dto, request, response)).rejects.toMatchObject({ status: 429 })
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', expect.stringMatching(/^\d+$/))
    expect(getStudentsUseCase.execute).toHaveBeenCalledTimes(5)
  })
})
