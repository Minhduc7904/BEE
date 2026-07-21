import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { GetMyTuitionPaymentIntentStatusUseCase } from 'src/application/use-cases/tuition-payment'
import { SocketAuthService } from 'src/infrastructure/services/socket/socket-auth.service'
import { SocketRoomService } from 'src/infrastructure/services/socket/socket-room.service'
import { SocketService } from 'src/infrastructure/services/socket/socket.service'
import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'
import { BaseGateway } from './base.gateway'

type IntentRoomPayload = { paymentIntentId: number }

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class TuitionPaymentIntentGateway extends BaseGateway {
  constructor(
    socketService: SocketService,
    socketAuthService: SocketAuthService,
    socketRoomService: SocketRoomService,
    private readonly getMyTuitionPaymentIntentStatusUseCase: GetMyTuitionPaymentIntentStatusUseCase,
  ) {
    super(socketService, socketAuthService, socketRoomService)
  }

  @SubscribeMessage(SOCKET_EVENTS.TUITION_PAYMENT.INTENT_SUBSCRIBE)
  async subscribeIntent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: IntentRoomPayload,
  ): Promise<void> {
    const studentId = this.requireStudent(client)
    if (!studentId) return
    if (!this.isValidPaymentIntentId(payload?.paymentIntentId)) {
      this.emitError(client, 'Payment intent ID kh\u00f4ng h\u1ee3p l\u1ec7', 'INVALID_PAYMENT_INTENT_ID')
      return
    }

    try {
      const intent = await this.getMyTuitionPaymentIntentStatusUseCase.getByPaymentIntentId(
        payload.paymentIntentId,
        studentId,
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
  unsubscribeIntent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: IntentRoomPayload,
  ): void {
    if (!this.requireStudent(client)) return
    if (!this.isValidPaymentIntentId(payload?.paymentIntentId)) {
      this.emitError(client, 'Payment intent ID kh\u00f4ng h\u1ee3p l\u1ec7', 'INVALID_PAYMENT_INTENT_ID')
      return
    }

    this.socketService.leaveRoom(client, this.getIntentRoom(payload.paymentIntentId))
    this.emitSuccess(client, SOCKET_EVENTS.TUITION_PAYMENT.INTENT_UNSUBSCRIBED, {
      paymentIntentId: payload.paymentIntentId,
    })
  }

  private requireStudent(client: Socket): number | null {
    const studentId = this.getUser(client)?.studentId
    if (!studentId) {
      this.emitError(client, 'Ch\u1ec9 h\u1ecdc sinh m\u1edbi c\u00f3 th\u1ec3 theo d\u00f5i thanh to\u00e1n h\u1ecdc ph\u00ed', 'STUDENT_REQUIRED')
      return null
    }
    return studentId
  }

  private isValidPaymentIntentId(paymentIntentId: unknown): paymentIntentId is number {
    return typeof paymentIntentId === 'number' && Number.isSafeInteger(paymentIntentId) && paymentIntentId > 0
  }

  private getIntentRoom(paymentIntentId: number): string {
    return `tuition-payment-intent:${paymentIntentId}`
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : '\u0110\u00e3 x\u1ea3y ra l\u1ed7i kh\u00f4ng x\u00e1c \u0111\u1ecbnh'
  }
}
