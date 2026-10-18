import { Injectable } from '@nestjs/common'
import { ParentAccountRealtimeRevocationService } from '../../../application/interfaces/parent-account-deletion.interface'
import { SocketService } from './socket.service'

@Injectable()
export class SocketParentAccountRevocationService extends ParentAccountRealtimeRevocationService {
  constructor(private readonly socketService: SocketService) {
    super()
  }

  async revoke(userId: number): Promise<void> {
    const server = this.socketService.getServer()
    if (!server) return
    const sockets = await server.in(`user:${userId}`).fetchSockets()
    for (const socket of sockets) {
      socket.emit('account-deleted', { code: 'ACCOUNT_DELETED' })
      socket.disconnect(true)
    }
  }
}
