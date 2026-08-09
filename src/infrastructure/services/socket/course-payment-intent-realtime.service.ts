import { Injectable } from '@nestjs/common'
import {
  CoursePaymentIntentRealtimeService as CoursePaymentIntentRealtimeServicePort,
  CoursePaymentIntentStatusPayload,
} from '../../../application/interfaces'
import { SOCKET_EVENTS } from '../../../shared/constants/socket-events.constant'
import { SocketService } from './socket.service'

@Injectable()
export class CoursePaymentIntentRealtimeService extends CoursePaymentIntentRealtimeServicePort {
  constructor(private readonly socketService: SocketService) {
    super()
  }

  notifyIntentPaid(payload: CoursePaymentIntentStatusPayload): void {
    this.socketService.emitToRoom(
      `course-payment-intent:${payload.paymentIntentId}`,
      SOCKET_EVENTS.COURSE_PAYMENT.INTENT_PAID,
      {
        success: true,
        intent: payload,
        timestamp: new Date().toISOString(),
      },
    )
  }
}
