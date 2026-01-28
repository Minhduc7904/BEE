import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentStatsResponseDto } from 'src/application/dtos'
import { TuitionPaymentStatsQueryDto } from 'src/application/dtos/tuition-payment'
import type { ITuitionPaymentRepository } from 'src/domain/repositories'
import { TuitionPaymentStatus } from 'src/shared/enums'

@Injectable()
export class GetTuitionPaymentStatsByStatusUseCase {
  constructor(
    @Inject('ITuitionPaymentRepository')
    private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
  ) {}

  async execute(query: TuitionPaymentStatsQueryDto): Promise<BaseResponseDto<TuitionPaymentStatsResponseDto>> {
    const stats = await this.tuitionPaymentRepository.statsByStatus(query.toFilterOptions())
    /**
     * Chuẩn hóa response:
     * - Luôn có đủ PAID / UNPAID
     */
    const map = new Map<TuitionPaymentStatus, number>()
    for (const s of stats) {
      map.set(s.status, s.total)
    }

    return BaseResponseDto.success(
      'Thống kê học phí theo trạng thái thành công',
      new TuitionPaymentStatsResponseDto({
        paid: map.get(TuitionPaymentStatus.PAID) || 0,
        unpaid: map.get(TuitionPaymentStatus.UNPAID) || 0,
      }),
    )
  }
}
