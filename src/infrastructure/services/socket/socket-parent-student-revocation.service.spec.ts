import { SOCKET_EVENTS } from '../../../shared/constants/socket-events.constant'
import { SocketParentStudentRevocationService } from './socket-parent-student-revocation.service'

function remoteSocket(id: string, subscriptions: Record<string, number> | undefined) {
  return {
    id,
    data: subscriptions ? { tuitionIntentStudents: subscriptions } : {},
    leave: jest.fn(),
    emit: jest.fn(),
  }
}

describe('SocketParentStudentRevocationService', () => {
  const fetchSockets = jest.fn()
  const inRoom = jest.fn(() => ({ fetchSockets }))
  const socketService = { getServer: jest.fn(() => ({ in: inRoom })) }
  const service = new SocketParentStudentRevocationService(socketService as never)

  beforeEach(() => {
    jest.clearAllMocks()
    socketService.getServer.mockReturnValue({ in: inRoom })
  })

  it('makes every socket of the parent leave only the intent rooms of the unlinked student', async () => {
    const first = remoteSocket('a', { '15': 12, '16': 99 })
    const second = remoteSocket('b', { '15': 12 })
    const unrelated = remoteSocket('c', undefined)
    fetchSockets.mockResolvedValue([first, second, unrelated])

    await service.revokeStudentAccess(10, 12)

    expect(inRoom).toHaveBeenCalledWith('user:10')
    expect(first.leave).toHaveBeenCalledTimes(1)
    expect(first.leave).toHaveBeenCalledWith('tuition-payment-intent:15')
    expect(second.leave).toHaveBeenCalledWith('tuition-payment-intent:15')
    expect(unrelated.leave).not.toHaveBeenCalled()
    expect(first.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.TUITION_PAYMENT.INTENT_UNSUBSCRIBED,
      expect.objectContaining({ paymentIntentId: 15, reason: 'ACCESS_REVOKED' }),
    )
  })

  it('does nothing when the socket server is not initialised', async () => {
    socketService.getServer.mockReturnValue(undefined as never)

    await expect(service.revokeStudentAccess(10, 12)).resolves.toBeUndefined()
    expect(fetchSockets).not.toHaveBeenCalled()
  })
})
