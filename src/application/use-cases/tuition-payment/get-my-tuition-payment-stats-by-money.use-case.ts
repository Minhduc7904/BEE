import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import { MyTuitionPaymentStatsQueryDto } from 'src/application/dtos/tuition-payment'
import type { ITuitionPaymentRepository } from 'src/domain/repositories'
import { TuitionPaymentMoneyStatsResponseDto } from 'src/application/dtos/tuition-payment/tuition-payment-money-stats-response.dto'

@Injectable()
export class GetMyTuitionPaymentStatsByMoneyUseCase {
  constructor(
    @Inject('ITuitionPaymentRepository')
    private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
  ) {}

  async execute(
    query: MyTuitionPaymentStatsQueryDto,
    studentId: number,
  ): Promise<BaseResponseDto<TuitionPaymentMoneyStatsResponseDto>> {
    const stats = await this.tuitionPaymentRepository.statsMoney({
      ...query.toFilterOptions(),
      studentId, // 🔒 ÉP từ token, không cho override
    })

    return BaseResponseDto.success(
      'Thống kê số tiền học phí của bạn thành công',
      new TuitionPaymentMoneyStatsResponseDto({
        collected: stats.collected,
        uncollected: stats.uncollected,
        expected: stats.expected,
      }),
    )
  }
}
