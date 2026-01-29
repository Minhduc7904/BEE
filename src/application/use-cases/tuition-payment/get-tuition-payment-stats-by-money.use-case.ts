import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import { TuitionPaymentStatsQueryDto } from 'src/application/dtos/tuition-payment'
import type { ITuitionPaymentRepository } from 'src/domain/repositories'
import { TuitionPaymentMoneyStatsResponseDto } from 'src/application/dtos/tuition-payment/tuition-payment-money-stats-response.dto'

@Injectable()
export class GetTuitionPaymentStatsByMoneyUseCase {
  constructor(
    @Inject('ITuitionPaymentRepository')
    private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
  ) {}

  async execute(query: TuitionPaymentStatsQueryDto): Promise<BaseResponseDto<TuitionPaymentMoneyStatsResponseDto>> {
    const stats = await this.tuitionPaymentRepository.statsMoney(query.toFilterOptions())

    return BaseResponseDto.success(
      'Thống kê số tiền học phí thành công',
      new TuitionPaymentMoneyStatsResponseDto({
        collected: stats.collected,
        uncollected: stats.uncollected,
        expected: stats.expected,
      }),
    )
  }
}
