import { HealthController } from './health.controller'

describe('HealthController', () => {
  const controller = new HealthController()

  it('returns pong for a lightweight liveness check', () => {
    expect(controller.ping()).toBe('pong')
  })

  it('returns a healthy status payload', () => {
    const result = controller.check()

    expect(result.status).toBe('ok')
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
    expect(result.uptime).toBeGreaterThanOrEqual(0)
  })
})
