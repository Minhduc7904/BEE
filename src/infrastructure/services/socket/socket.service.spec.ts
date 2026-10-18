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

  describe('online statistics', () => {
    function serviceWithSockets(sockets: Record<string, { userType: string }>) {
      const rooms = new Map<string, Set<string>>()
      const socketMap = new Map<string, { data: { user: { userType: string } } }>()
      Object.entries(sockets).forEach(([userId, user]) => {
        rooms.set(`user:${userId}`, new Set([`socket-${userId}`]))
        socketMap.set(`socket-${userId}`, { data: { user } })
      })
      const service = new SocketService()
      service.setServer({ sockets: { adapter: { rooms }, sockets: socketMap } } as any)
      return service
    }

    it('đếm riêng phụ huynh và tính vào tổng', () => {
      const service = serviceWithSockets({
        '1': { userType: 'admin' },
        '2': { userType: 'student' },
        '3': { userType: 'parent' },
        '4': { userType: 'parent' },
      })

      expect(service.getOnlineUsersByType()).toEqual({ admin: 1, student: 1, parent: 2, total: 4 })
      expect(service.getOnlineUsersStats()).toEqual({
        admin: { count: 1, userIds: [1] },
        student: { count: 1, userIds: [2] },
        parent: { count: 2, userIds: [3, 4] },
        total: 4,
      })
    })
  })
})
