import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as paymentIntentUseCases from './'

const PAYMENT_INTENT_USE_CASES = [
  paymentIntentUseCases.CreatePaymentIntentForTuitionPaymentUseCase,
  paymentIntentUseCases.CreatePaymentIntentsByGradePeriodUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: PAYMENT_INTENT_USE_CASES,
  exports: PAYMENT_INTENT_USE_CASES,
})
export class PaymentIntentApplicationModule {}
