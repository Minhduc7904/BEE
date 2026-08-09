import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { GetMyCoursePaymentIntentStatusUseCase } from '../../application/use-cases/course-payment'
import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SOCKET_EVENTS } from '../../shared/constants/socket-events.constant'
import { BaseGateway } from './base.gateway'

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true } })
export class CoursePaymentIntentGateway extends BaseGateway {
  constructor(
    socketService: SocketService,
    socketAuthService: SocketAuthService,
    socketRoomService: SocketRoomService,
    private readonly getMyCoursePaymentIntentStatusUseCase: GetMyCoursePaymentIntentStatusUseCase,
  ) {
    super(socketService, socketAuthService, socketRoomService)
  }

  @SubscribeMessage(SOCKET_EVENTS.COURSE_PAYMENT.INTENT_SUBSCRIBE)
  async subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { paymentIntentId: number },
  ): Promise<void> {
    const studentId = this.getUser(client)?.studentId
    if (!studentId || !Number.isSafeInteger(payload?.paymentIntentId) || payload.paymentIntentId <= 0) {
      this.emitError(client, 'Payment intent không hợp lệ', 'INVALID_PAYMENT_INTENT_ID')
      return
    }
    try {
      const intent = await this.getMyCoursePaymentIntentStatusUseCase.execute(payload.paymentIntentId, studentId)
      this.socketService.joinRoom(client, this.room(intent.paymentIntentId))
      this.emitSuccess(client, SOCKET_EVENTS.COURSE_PAYMENT.INTENT_SUBSCRIBED, {
        paymentIntentId: intent.paymentIntentId,
      })
      this.emitSuccess(client, SOCKET_EVENTS.COURSE_PAYMENT.INTENT_STATUS, { intent })
    } catch (error) {
      this.emitError(
        client,
        error instanceof Error ? error.message : 'Không thể theo dõi thanh toán',
        'COURSE_PAYMENT_INTENT_SUBSCRIBE_FAILED',
      )
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.COURSE_PAYMENT.INTENT_UNSUBSCRIBE)
  unsubscribe(@ConnectedSocket() client: Socket, @MessageBody() payload: { paymentIntentId: number }): void {
    if (Number.isSafeInteger(payload?.paymentIntentId) && payload.paymentIntentId > 0) {
      this.socketService.leaveRoom(client, this.room(payload.paymentIntentId))
      this.emitSuccess(client, SOCKET_EVENTS.COURSE_PAYMENT.INTENT_UNSUBSCRIBED, {
        paymentIntentId: payload.paymentIntentId,
      })
    }
  }

  private room(paymentIntentId: number): string {
    return `course-payment-intent:${paymentIntentId}`
  }
}
