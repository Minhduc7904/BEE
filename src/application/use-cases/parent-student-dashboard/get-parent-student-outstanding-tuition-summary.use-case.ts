import { Injectable } from '@nestjs/common'

import type {
  AuthenticatedUser,
  ParentOutstandingTuitionPayment,
  ParentOutstandingTuitionSummary,
} from '../../interfaces'
import { ParentStudentDashboardReadService } from '../../interfaces'
import { ParentOutstandingTuitionSummaryDto } from '../../dtos/parent-student-dashboard'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
  isTuitionOverdue,
  resolveTuitionDueDate,
} from '../../../domain/entities/tuition-payment/tuition-payment-due-date'
import { assertParentManagesStudent } from './parent-student-dashboard-access'

@Injectable()
export class GetParentStudentOutstandingTuitionSummaryUseCase {
  constructor(private readonly dashboard: ParentStudentDashboardReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    now: Date = new Date(),
  ): Promise<BaseResponseDto<ParentOutstandingTuitionSummaryDto>> {
    await assertParentManagesStudent(identity, studentId, this.dashboard)

    const unpaid = await this.dashboard.listUnpaidTuitionPayments(studentId)
    // V1: schema chưa có cột dueDate nên explicitDueDate luôn null → hạn là cuối tháng (PERIOD_END).
    const payments: ParentOutstandingTuitionPayment[] = unpaid.map((payment) => {
      const { effectiveDueDate, source } = resolveTuitionDueDate({
        month: payment.month,
        year: payment.year,
        explicitDueDate: null,
      })
      return {
        ...payment,
        effectiveDueDate,
        dueDateSource: source,
        isOverdue: isTuitionOverdue(effectiveDueDate, now),
      }
    })

    const summary: ParentOutstandingTuitionSummary = {
      outstandingCount: payments.length,
      totalOutstandingAmount: payments.reduce((total, payment) => total + (payment.amount ?? 0), 0),
      unknownAmountCount: payments.filter((payment) => payment.amount === null).length,
      overdueCount: payments.filter((payment) => payment.isOverdue).length,
      primaryPayment: [...payments].sort(comparePaymentsByDueDate)[0] ?? null,
    }

    return BaseResponseDto.success(
      payments.length === 0 ? 'Không có học phí chưa đóng' : 'Lấy tổng hợp học phí chưa đóng thành công',
      ParentOutstandingTuitionSummaryDto.fromResult(summary),
    )
  }
}

function comparePaymentsByDueDate(
  left: ParentOutstandingTuitionPayment,
  right: ParentOutstandingTuitionPayment,
): number {
  return left.effectiveDueDate.getTime() - right.effectiveDueDate.getTime() || left.paymentId - right.paymentId
}
