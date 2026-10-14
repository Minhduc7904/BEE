import type { ParentOutstandingTuitionSummary } from '../../interfaces'
import type { DueDateSource } from '../../../shared/enums/due-date-source.enum'
import { ParentOutstandingTuitionPaymentDto } from './parent-outstanding-tuition-payment.dto'

export class ParentOutstandingTuitionSummaryDto {
  currency: 'VND'
  outstandingCount: number
  totalOutstandingAmount: number
  unknownAmountCount: number
  overdueCount: number
  nearestEffectiveDueDate: string | null
  nearestDueDateSource: DueDateSource | null
  primaryPayment: ParentOutstandingTuitionPaymentDto | null

  static fromResult(result: ParentOutstandingTuitionSummary): ParentOutstandingTuitionSummaryDto {
    return {
      currency: 'VND',
      outstandingCount: result.outstandingCount,
      totalOutstandingAmount: result.totalOutstandingAmount,
      unknownAmountCount: result.unknownAmountCount,
      overdueCount: result.overdueCount,
      nearestEffectiveDueDate: result.primaryPayment ? result.primaryPayment.effectiveDueDate.toISOString() : null,
      nearestDueDateSource: result.primaryPayment ? result.primaryPayment.dueDateSource : null,
      primaryPayment: result.primaryPayment
        ? ParentOutstandingTuitionPaymentDto.fromResult(result.primaryPayment)
        : null,
    }
  }
}
