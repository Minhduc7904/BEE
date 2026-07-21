import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { Socket } from 'socket.io'

import { SeoPaymentIntentSocketPayload } from '../../application/dtos'
import { SeoTuitionPaymentService } from '../../application/use-cases/seo-tuition-payment'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SOCKET_EVENTS } from '../../shared/constants/socket-events.constant'

@WebSocketGateway({
  namespace: '/seo',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class SeoTuitionPaymentIntentGateway {
  constructor(
    private readonly socketService: SocketService,
    private readonly seoTuitionPaymentService: SeoTuitionPaymentService,
  ) {}

  @SubscribeMessage(SOCKET_EVENTS.TUITION_PAYMENT.INTENT_SUBSCRIBE)
  async subscribeIntent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SeoPaymentIntentSocketPayload,
  ): Promise<void> {
    if (!this.isValidPayload(payload)) {
      this.emitError(client, 'Thông tin theo dõi thanh toán không hợp lệ', 'INVALID_PAYMENT_INTENT_ID')
      return
    }

    try {
      const intent = await this.seoTuitionPaymentService.getIntentStatusByPaymentIntentId(
        payload.studentId,
        payload.parentPhone,
        payload.paymentIntentId,
      )
      this.socketService.joinRoom(client, this.getIntentRoom(intent.paymentIntentId))
      this.emitSuccess(client, SOCKET_EVENTS.TUITION_PAYMENT.INTENT_SUBSCRIBED, {
        paymentIntentId: intent.paymentIntentId,
      })
      this.emitSuccess(client, SOCKET_EVENTS.TUITION_PAYMENT.INTENT_STATUS, { intent })
    } catch (error) {
      this.emitError(client, this.errorMessage(error), 'TUITION_PAYMENT_INTENT_SUBSCRIBE_FAILED')
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.TUITION_PAYMENT.INTENT_UNSUBSCRIBE)
  async unsubscribeIntent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SeoPaymentIntentSocketPayload,
  ): Promise<void> {
    if (!this.isValidPayload(payload)) {
      this.emitError(client, 'Thông tin theo dõi thanh toán không hợp lệ', 'INVALID_PAYMENT_INTENT_ID')
      return
    }

    try {
      await this.seoTuitionPaymentService.getIntentStatusByPaymentIntentId(
        payload.studentId,
        payload.parentPhone,
        payload.paymentIntentId,
      )
      this.socketService.leaveRoom(client, this.getIntentRoom(payload.paymentIntentId))
      this.emitSuccess(client, SOCKET_EVENTS.TUITION_PAYMENT.INTENT_UNSUBSCRIBED, {
        paymentIntentId: payload.paymentIntentId,
      })
    } catch (error) {
      this.emitError(client, this.errorMessage(error), 'TUITION_PAYMENT_INTENT_UNSUBSCRIBE_FAILED')
    }
  }

  private isValidPayload(payload: SeoPaymentIntentSocketPayload): boolean {
    return (
      Number.isSafeInteger(payload?.studentId) &&
      payload.studentId > 0 &&
      Number.isSafeInteger(payload?.paymentIntentId) &&
      payload.paymentIntentId > 0 &&
      typeof payload?.parentPhone === 'string' &&
      payload.parentPhone.trim().length > 0
    )
  }

  private getIntentRoom(paymentIntentId: number): string {
    return `tuition-payment-intent:${paymentIntentId}`
  }

  private emitSuccess(client: Socket, event: string, data: object): void {
    client.emit(event, { success: true, ...data, timestamp: new Date().toISOString() })
  }

  private emitError(client: Socket, message: string, code: string): void {
    client.emit('error', { message, code, timestamp: new Date().toISOString() })
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'
  }
}
