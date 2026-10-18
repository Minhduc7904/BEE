import { Injectable, Logger } from '@nestjs/common'

import { ParentStudentRealtimeRevocationService } from 'src/application/interfaces/parent-student-realtime-revocation.interface'
import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'
import { SocketService } from './socket.service'
import {
  getTuitionPaymentIntentRoom,
  TUITION_INTENT_STUDENTS_KEY,
  TuitionIntentStudents,
} from './tuition-payment-intent-subscriptions'

export const REALTIME_ACCESS_REVOKED = 'ACCESS_REVOKED'

@Injectable()
export class SocketParentStudentRevocationService extends ParentStudentRealtimeRevocationService {
  private readonly logger = new Logger(SocketParentStudentRevocationService.name)

  constructor(private readonly socketService: SocketService) {
    super()
  }

  async revokeStudentAccess(parentUserId: number, studentId: number): Promise<void> {
    const server = this.socketService.getServer()
    if (!server) return

    // Mọi socket của tài khoản phụ huynh nằm trong room `user:{userId}` do SocketLifecycleGateway quản lý.
    const sockets = await server.in(`user:${parentUserId}`).fetchSockets()
    for (const socket of sockets) {
      const subscriptions = (socket.data?.[TUITION_INTENT_STUDENTS_KEY] ?? {}) as TuitionIntentStudents
      for (const [paymentIntentId, subscribedStudentId] of Object.entries(subscriptions)) {
        if (subscribedStudentId !== studentId) continue

        socket.leave(getTuitionPaymentIntentRoom(Number(paymentIntentId)))
        socket.emit(SOCKET_EVENTS.TUITION_PAYMENT.INTENT_UNSUBSCRIBED, {
          success: true,
          paymentIntentId: Number(paymentIntentId),
          reason: REALTIME_ACCESS_REVOKED,
          timestamp: new Date().toISOString(),
        })
        this.logger.debug(`Revoked socket ${socket.id} from intent ${paymentIntentId} of student ${studentId}`)
      }
    }
  }
}
