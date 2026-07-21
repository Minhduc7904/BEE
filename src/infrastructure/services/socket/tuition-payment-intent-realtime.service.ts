import { Injectable } from '@nestjs/common'
import {
  TuitionPaymentIntentRealtimeService as TuitionPaymentIntentRealtimeServicePort,
  TuitionPaymentIntentStatusPayload,
} from 'src/application/interfaces'
import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'
import { SocketService } from './socket.service'

@Injectable()
export class TuitionPaymentIntentRealtimeService extends TuitionPaymentIntentRealtimeServicePort {
  constructor(private readonly socketService: SocketService) {
    super()
  }

  notifyIntentPaid(payload: TuitionPaymentIntentStatusPayload): void {
    this.socketService.emitToRoom(this.getIntentRoom(payload.paymentIntentId), SOCKET_EVENTS.TUITION_PAYMENT.INTENT_PAID, {
      success: true,
      intent: payload,
      timestamp: new Date().toISOString(),
    })
  }

  private getIntentRoom(paymentIntentId: number): string {
    return `tuition-payment-intent:${paymentIntentId}`
  }
}
