import { SocketService } from './socket.service'

describe('SocketService', () => {
  it('emit notification vào đúng room user đã xác thực', () => {
    const emit = jest.fn()
    const to = jest.fn().mockReturnValue({ emit })
    const service = new SocketService()
    service.setServer({ to, sockets: { adapter: { rooms: new Map() } } } as any)

    service.emitToUser(20, 'notification:changed', { version: 1 })

    expect(to).toHaveBeenCalledWith('user:20')
    expect(emit).toHaveBeenCalledWith('notification:changed', { version: 1 })
  })
})
