import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { Socket } from 'socket.io'
import type { TuitionPaymentIntentStatusResponseDto } from 'src/application/dtos'
import {
  GetMyTuitionPaymentIntentStatusUseCase,
  GetParentTuitionPaymentIntentStatusUseCase,
} from 'src/application/use-cases/tuition-payment'
import { SocketAuthService } from 'src/infrastructure/services/socket/socket-auth.service'
import { SocketRoomService } from 'src/infrastructure/services/socket/socket-room.service'
import { SocketService } from 'src/infrastructure/services/socket/socket.service'
import {
  getTuitionPaymentIntentRoom,
  TUITION_INTENT_STUDENTS_KEY,
  TuitionIntentStudents,
} from 'src/infrastructure/services/socket/tuition-payment-intent-subscriptions'
import { SOCKET_EVENTS } from 'src/shared/constants/socket-events.constant'
import { BaseGateway } from './base.gateway'

type IntentRoomPayload = { paymentIntentId: number }

type TuitionIntentActor = { kind: 'student'; studentId: number } | { kind: 'parent'; parentId: number }

type IntentSubscription = { studentId: number; intent: TuitionPaymentIntentStatusResponseDto }

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
    private readonly getParentTuitionPaymentIntentStatusUseCase: GetParentTuitionPaymentIntentStatusUseCase,
  ) {
    super(socketService, socketAuthService, socketRoomService)
  }

  @SubscribeMessage(SOCKET_EVENTS.TUITION_PAYMENT.INTENT_SUBSCRIBE)
  async subscribeIntent(@ConnectedSocket() client: Socket, @MessageBody() payload: IntentRoomPayload): Promise<void> {
    const actor = this.requireActor(client)
    if (!actor) return
    if (!this.isValidPaymentIntentId(payload?.paymentIntentId)) {
      this.emitError(client, 'Payment intent ID không hợp lệ', 'INVALID_PAYMENT_INTENT_ID')
      return
    }

    const paymentIntentId = payload.paymentIntentId
    const room = getTuitionPaymentIntentRoom(paymentIntentId)
    let joined = false
    try {
      // Lần đọc đầu chỉ để xác minh quyền trước khi cho join; không gửi snapshot này cho client.
      const authorized = await this.resolveIntent(actor, paymentIntentId)
      this.socketService.joinRoom(client, room)
      joined = true
      if (actor.kind === 'parent') this.rememberParentSubscription(client, paymentIntentId, authorized.studentId)

      // Đọc lại SAU khi join: nếu thanh toán commit giữa lần đọc đầu và lúc join thì event `paid` đã phát khi socket
      // chưa ở trong room; snapshot này luôn phản ánh trạng thái mới nhất nên client không bao giờ bỏ lỡ `PAID`.
      const { intent } = await this.resolveIntent(actor, paymentIntentId)
      this.emitSuccess(client, SOCKET_EVENTS.TUITION_PAYMENT.INTENT_SUBSCRIBED, {
        paymentIntentId: intent.paymentIntentId,
      })
      this.emitSuccess(client, SOCKET_EVENTS.TUITION_PAYMENT.INTENT_STATUS, { intent })
    } catch (error) {
      if (joined) this.leaveIntent(client, paymentIntentId)
      this.emitError(client, this.errorMessage(error), 'TUITION_PAYMENT_INTENT_SUBSCRIBE_FAILED')
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.TUITION_PAYMENT.INTENT_UNSUBSCRIBE)
  unsubscribeIntent(@ConnectedSocket() client: Socket, @MessageBody() payload: IntentRoomPayload): void {
    if (!this.requireActor(client)) return
    if (!this.isValidPaymentIntentId(payload?.paymentIntentId)) {
      this.emitError(client, 'Payment intent ID không hợp lệ', 'INVALID_PAYMENT_INTENT_ID')
      return
    }

    this.leaveIntent(client, payload.paymentIntentId)
    this.emitSuccess(client, SOCKET_EVENTS.TUITION_PAYMENT.INTENT_UNSUBSCRIBED, {
      paymentIntentId: payload.paymentIntentId,
    })
  }

  private resolveIntent(actor: TuitionIntentActor, paymentIntentId: number): Promise<IntentSubscription> {
    if (actor.kind === 'parent') {
      return this.getParentTuitionPaymentIntentStatusUseCase.getByPaymentIntentId(paymentIntentId, actor.parentId)
    }

    return this.getMyTuitionPaymentIntentStatusUseCase
      .getByPaymentIntentId(paymentIntentId, actor.studentId)
      .then((intent) => ({ studentId: actor.studentId, intent }))
  }

  private rememberParentSubscription(client: Socket, paymentIntentId: number, studentId: number): void {
    const current = (client.data[TUITION_INTENT_STUDENTS_KEY] ?? {}) as TuitionIntentStudents
    client.data[TUITION_INTENT_STUDENTS_KEY] = { ...current, [paymentIntentId]: studentId }
  }

  private leaveIntent(client: Socket, paymentIntentId: number): void {
    this.socketService.leaveRoom(client, getTuitionPaymentIntentRoom(paymentIntentId))
    const current = client.data[TUITION_INTENT_STUDENTS_KEY] as TuitionIntentStudents | undefined
    if (current && String(paymentIntentId) in current) {
      const { [String(paymentIntentId)]: _removed, ...rest } = current
      client.data[TUITION_INTENT_STUDENTS_KEY] = rest
    }
  }

  private requireActor(client: Socket): TuitionIntentActor | null {
    const user = this.getUser(client)
    // Danh tính lấy từ JWT đã được SocketLifecycleGateway xác thực; không nhận studentId/parentId từ client.
    if (user?.userType === 'parent' && user.parentId) return { kind: 'parent', parentId: user.parentId }
    if (user?.studentId) return { kind: 'student', studentId: user.studentId }

    this.emitError(
      client,
      'Chỉ học sinh hoặc phụ huynh mới có thể theo dõi thanh toán học phí',
      'STUDENT_OR_PARENT_REQUIRED',
    )
    return null
  }

  private isValidPaymentIntentId(paymentIntentId: unknown): paymentIntentId is number {
    return typeof paymentIntentId === 'number' && Number.isSafeInteger(paymentIntentId) && paymentIntentId > 0
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'
  }
}
