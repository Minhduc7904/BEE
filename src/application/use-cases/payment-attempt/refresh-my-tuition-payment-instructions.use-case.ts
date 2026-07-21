import { Injectable } from '@nestjs/common'

import { BaseResponseDto, PaymentInstructionResponseDto } from '../../dtos'
import { GetMyTuitionPaymentInstructionsUseCase } from './get-my-tuition-payment-instructions.use-case'

@Injectable()
export class RefreshMyTuitionPaymentInstructionsUseCase {
  constructor(private readonly getMyTuitionPaymentInstructionsUseCase: GetMyTuitionPaymentInstructionsUseCase) {}

  async execute(
    tuitionPaymentId: number,
    studentId: number,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    return this.getMyTuitionPaymentInstructionsUseCase.execute(tuitionPaymentId, studentId, {
      forceRefresh: true,
    })
  }
}
