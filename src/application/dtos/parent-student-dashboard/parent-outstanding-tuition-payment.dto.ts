import type { ParentOutstandingTuitionPayment } from '../../interfaces'
import type { DueDateSource } from '../../../shared/enums/due-date-source.enum'

export class ParentOutstandingTuitionPaymentDto {
  paymentId: number
  amount: number | null
  month: number
  year: number
  effectiveDueDate: string
  dueDateSource: DueDateSource
  isOverdue: boolean

  static fromResult(result: ParentOutstandingTuitionPayment): ParentOutstandingTuitionPaymentDto {
    return {
      paymentId: result.paymentId,
      amount: result.amount,
      month: result.month,
      year: result.year,
      effectiveDueDate: result.effectiveDueDate.toISOString(),
      dueDateSource: result.dueDateSource,
      isOverdue: result.isOverdue,
    }
  }
}
