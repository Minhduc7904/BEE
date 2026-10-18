import { SocketParentAccountRevocationService } from './socket-parent-account-revocation.service'

describe('SocketParentAccountRevocationService', () => {
  it('phát sự kiện rồi ngắt mọi socket đang mở của user', async () => {
    const sockets = [
      { emit: jest.fn(), disconnect: jest.fn() },
      { emit: jest.fn(), disconnect: jest.fn() },
    ]
    const fetchSockets = jest.fn().mockResolvedValue(sockets)
    const inRoom = jest.fn().mockReturnValue({ fetchSockets })
    const service = new SocketParentAccountRevocationService({
      getServer: jest.fn().mockReturnValue({ in: inRoom }),
    } as never)

    await service.revoke(12)

    expect(inRoom).toHaveBeenCalledWith('user:12')
    for (const socket of sockets) {
      expect(socket.emit).toHaveBeenCalledWith('account-deleted', { code: 'ACCOUNT_DELETED' })
      expect(socket.disconnect).toHaveBeenCalledWith(true)
    }
  })

  it('không lỗi khi Socket.IO chưa khởi tạo', async () => {
    const service = new SocketParentAccountRevocationService({
      getServer: jest.fn().mockReturnValue(null),
    } as never)

    await expect(service.revoke(12)).resolves.toBeUndefined()
  })
})
