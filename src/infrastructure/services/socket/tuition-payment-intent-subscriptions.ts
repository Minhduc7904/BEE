/** Room theo dõi một payment intent học phí; tên room do server sinh, không bao giờ nhận từ client. */
export function getTuitionPaymentIntentRoom(paymentIntentId: number): string {
  return `tuition-payment-intent:${paymentIntentId}`
}

/**
 * Khóa trong `socket.data`: `{ [paymentIntentId]: studentId }` của các intent mà socket (phụ huynh) đang theo dõi.
 * Dùng object thuần để vẫn đọc được qua `fetchSockets()` khi chạy nhiều instance với shared adapter.
 */
export const TUITION_INTENT_STUDENTS_KEY = 'tuitionIntentStudents'

export type TuitionIntentStudents = Record<string, number>
