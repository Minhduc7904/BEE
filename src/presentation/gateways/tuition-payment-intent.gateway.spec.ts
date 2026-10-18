import { MESSAGE_MAPPING_METADATA, MESSAGE_METADATA } from '@nestjs/websockets/constants'
import type { Socket } from 'socket.io'

import { ForbiddenException } from '../../shared/exceptions/custom-exceptions'
import { SOCKET_EVENTS } from '../../shared/constants/socket-events.constant'
import { TuitionPaymentIntentGateway } from './tuition-payment-intent.gateway'

const EVENTS = SOCKET_EVENTS.TUITION_PAYMENT

function intentSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    paymentIntentId: 15,
    tuitionPaymentId: 201,
    tuitionPaymentStatus: 'UNPAID',
    intentStatus: 'PENDING',
    paidAt: null,
    intentUpdatedAt: new Date('2026-10-17T03:00:00.000Z'),
    ...overrides,
  }
}

function fakeClient(user: Record<string, unknown> | undefined) {
  const emitted: Array<{ event: string; payload: any }> = []
  const client = {
    data: { user },
    emit: jest.fn((event: string, payload: unknown) => emitted.push({ event, payload })),
  }
  return { client: client as unknown as Socket, raw: client, emitted }
}

describe('TuitionPaymentIntentGateway', () => {
  const socketService = { joinRoom: jest.fn(), leaveRoom: jest.fn() }
  const studentStatus = { getByPaymentIntentId: jest.fn() }
  const parentStatus = { getByPaymentIntentId: jest.fn() }
  const gateway = new TuitionPaymentIntentGateway(
    socketService as never,
    {} as never,
    {} as never,
    studentStatus as never,
    parentStatus as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    studentStatus.getByPaymentIntentId.mockResolvedValue(intentSnapshot())
    parentStatus.getByPaymentIntentId.mockResolvedValue({ studentId: 12, intent: intentSnapshot() })
  })

  it('keeps only the subscribe/unsubscribe messages and never accepts a room name from the client', () => {
    const messages = Object.getOwnPropertyNames(TuitionPaymentIntentGateway.prototype)
      .map((name) => TuitionPaymentIntentGateway.prototype[name as keyof TuitionPaymentIntentGateway])
      .filter(
        (handler): handler is (...args: unknown[]) => unknown =>
          typeof handler === 'function' && Reflect.getMetadata(MESSAGE_MAPPING_METADATA, handler),
      )
      .map((handler) => Reflect.getMetadata(MESSAGE_METADATA, handler))

    expect(messages.sort()).toEqual([EVENTS.INTENT_SUBSCRIBE, EVENTS.INTENT_UNSUBSCRIBE].sort())
  })

  describe('student actor', () => {
    const student = { userType: 'student', studentId: 12, userId: 5 }

    it('joins the room and sends the status snapshot', async () => {
      const { client, emitted } = fakeClient(student)

      await gateway.subscribeIntent(client, { paymentIntentId: 15 })

      expect(studentStatus.getByPaymentIntentId).toHaveBeenCalledWith(15, 12)
      expect(parentStatus.getByPaymentIntentId).not.toHaveBeenCalled()
      expect(socketService.joinRoom).toHaveBeenCalledWith(client, 'tuition-payment-intent:15')
      expect(emitted.map((item) => item.event)).toEqual([EVENTS.INTENT_SUBSCRIBED, EVENTS.INTENT_STATUS])
    })
  })

  describe('parent actor', () => {
    const parent = { userType: 'parent', parentId: 20, userId: 10 }

    it('joins the room only after ownership is verified through ParentStudent', async () => {
      const { client, raw, emitted } = fakeClient(parent)

      await gateway.subscribeIntent(client, { paymentIntentId: 15 })

      expect(parentStatus.getByPaymentIntentId).toHaveBeenCalledWith(15, 20)
      expect(studentStatus.getByPaymentIntentId).not.toHaveBeenCalled()
      expect(socketService.joinRoom).toHaveBeenCalledWith(client, 'tuition-payment-intent:15')
      expect(raw.data).toMatchObject({ tuitionIntentStudents: { '15': 12 } })
      expect(emitted.map((item) => item.event)).toEqual([EVENTS.INTENT_SUBSCRIBED, EVENTS.INTENT_STATUS])
    })

    it('does not join the room for an intent of a student the parent does not manage', async () => {
      parentStatus.getByPaymentIntentId.mockRejectedValue(new ForbiddenException('Bạn không có quyền'))
      const { client, emitted } = fakeClient(parent)

      await gateway.subscribeIntent(client, { paymentIntentId: 15 })

      expect(socketService.joinRoom).not.toHaveBeenCalled()
      expect(emitted).toHaveLength(1)
      expect(emitted[0]).toMatchObject({
        event: 'error',
        payload: { code: 'TUITION_PAYMENT_INTENT_SUBSCRIBE_FAILED' },
      })
    })

    it('re-reads the snapshot AFTER joining so a payment committed in between is never missed', async () => {
      const order: string[] = []
      parentStatus.getByPaymentIntentId
        .mockImplementationOnce(() => {
          order.push('authorize')
          return Promise.resolve({ studentId: 12, intent: intentSnapshot() })
        })
        .mockImplementationOnce(() => {
          order.push('snapshot')
          // Thanh toán commit giữa lần đọc đầu và lúc join: snapshot đọc lại phải là PAID.
          return Promise.resolve({
            studentId: 12,
            intent: intentSnapshot({ tuitionPaymentStatus: 'PAID', intentStatus: 'PAID' }),
          })
        })
      socketService.joinRoom.mockImplementation(() => order.push('join'))
      const { client, emitted } = fakeClient(parent)

      await gateway.subscribeIntent(client, { paymentIntentId: 15 })

      expect(order).toEqual(['authorize', 'join', 'snapshot'])
      const status = emitted.find((item) => item.event === EVENTS.INTENT_STATUS)
      expect(status?.payload.intent).toMatchObject({ tuitionPaymentStatus: 'PAID', intentStatus: 'PAID' })
    })

    it('leaves the room when the post-join read fails, e.g. the link was removed meanwhile', async () => {
      parentStatus.getByPaymentIntentId
        .mockResolvedValueOnce({ studentId: 12, intent: intentSnapshot() })
        .mockRejectedValueOnce(new ForbiddenException('Bạn không có quyền'))
      const { client, raw, emitted } = fakeClient(parent)

      await gateway.subscribeIntent(client, { paymentIntentId: 15 })

      expect(socketService.leaveRoom).toHaveBeenCalledWith(client, 'tuition-payment-intent:15')
      expect((raw.data as Record<string, unknown>).tuitionIntentStudents).toEqual({})
      expect(emitted.map((item) => item.event)).toEqual(['error'])
    })

    it('forgets the subscription on unsubscribe', async () => {
      const { client, raw, emitted } = fakeClient(parent)
      await gateway.subscribeIntent(client, { paymentIntentId: 15 })
      emitted.length = 0

      gateway.unsubscribeIntent(client, { paymentIntentId: 15 })

      expect(socketService.leaveRoom).toHaveBeenCalledWith(client, 'tuition-payment-intent:15')
      expect((raw.data as Record<string, unknown>).tuitionIntentStudents).toEqual({})
      expect(emitted.map((item) => item.event)).toEqual([EVENTS.INTENT_UNSUBSCRIBED])
    })
  })

  describe('other actors and invalid payloads', () => {
    it.each([
      ['an admin', { userType: 'admin', adminId: 1, userId: 1 }],
      ['an unauthenticated socket', undefined],
      ['a parent token without parentId', { userType: 'parent', userId: 1 }],
    ])('rejects %s', async (_, user) => {
      const { client, emitted } = fakeClient(user)

      await gateway.subscribeIntent(client, { paymentIntentId: 15 })

      expect(socketService.joinRoom).not.toHaveBeenCalled()
      expect(emitted[0]).toMatchObject({ event: 'error', payload: { code: 'STUDENT_OR_PARENT_REQUIRED' } })
    })

    it.each([0, -1, 1.5, '15', null, undefined])('rejects payment intent id %p', async (paymentIntentId) => {
      const { client, emitted } = fakeClient({ userType: 'parent', parentId: 20, userId: 10 })

      await gateway.subscribeIntent(client, { paymentIntentId } as never)

      expect(socketService.joinRoom).not.toHaveBeenCalled()
      expect(emitted[0]).toMatchObject({ event: 'error', payload: { code: 'INVALID_PAYMENT_INTENT_ID' } })
    })
  })
})
