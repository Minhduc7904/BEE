import { Inject, Injectable } from '@nestjs/common'
import type { ITuitionPaymentRepository } from '../../../domain/repositories/tuition-payment.repository'
import {
  MonthlyTuitionPaymentStatsQueryDto,
  MonthlyTuitionPaymentStatsResponseDto,
} from '../../dtos/tuition-payment'
import {
    BaseResponseDto,
} from '../../dtos/common/base-response.dto'
@Injectable()
export class GetMonthlyTuitionPaymentStatsUseCase {
  constructor(
    @Inject('ITuitionPaymentRepository')
    private readonly tuitionPaymentRepository: ITuitionPaymentRepository
) {}

  async execute(query: MonthlyTuitionPaymentStatsQueryDto): Promise<BaseResponseDto<MonthlyTuitionPaymentStatsResponseDto>> {
    const { year, courseId, studentId } = query

    // Get monthly stats from repository
    const months = await this.tuitionPaymentRepository.statsByMonthlyAmount(year, courseId, studentId)

    // Calculate totals
    const totalPaidAmount = months.reduce((sum, m) => sum + m.paidAmount, 0)
    const totalUnpaidAmount = months.reduce((sum, m) => sum + m.unpaidAmount, 0)
    const totalAmount = months.reduce((sum, m) => sum + m.totalAmount, 0)
    const totalPaidCount = months.reduce((sum, m) => sum + m.paidCount, 0)
    const totalUnpaidCount = months.reduce((sum, m) => sum + m.unpaidCount, 0)
    const totalCount = months.reduce((sum, m) => sum + m.totalCount, 0)

    return BaseResponseDto.success(
        'Lấy thống kê học phí theo tháng thành công',
        new MonthlyTuitionPaymentStatsResponseDto({
            year,
            months,
            totalPaidAmount,
            totalUnpaidAmount,
            totalAmount,
            totalPaidCount,
            totalUnpaidCount,
            totalCount,
        }),
    )
  }
}
