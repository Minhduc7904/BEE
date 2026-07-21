import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as paymentAttemptUseCases from './'

const PAYMENT_ATTEMPT_USE_CASES = [
  paymentAttemptUseCases.GetMyTuitionPaymentInstructionsUseCase,
  paymentAttemptUseCases.RefreshMyTuitionPaymentInstructionsUseCase,
  paymentAttemptUseCases.CancelMyPaymentAttemptUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: PAYMENT_ATTEMPT_USE_CASES,
  exports: PAYMENT_ATTEMPT_USE_CASES,
})
export class PaymentAttemptApplicationModule {}
