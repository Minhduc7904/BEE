import { RecoveryRateLimitService } from './recovery-rate-limit.service'

describe('RecoveryRateLimitService', () => {
  it('chặn request vượt ngưỡng trong cùng cửa sổ', () => {
    const service = new RecoveryRateLimitService()

    for (let index = 0; index < 5; index += 1) {
      expect(service.consume('students', 'ip:phone', 5, 60_000)).toBeNull()
    }

    expect(service.consume('students', 'ip:phone', 5, 60_000)).toBeGreaterThan(0)
    expect(service.consume('students', 'other-ip:phone', 5, 60_000)).toBeNull()
  })
})
