import { Module } from '@nestjs/common'

import * as tuitionPaymentUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const TUITION_PAYMENT_USE_CASES = [
  tuitionPaymentUseCase.CreateTuitionPaymentUseCase,
  tuitionPaymentUseCase.CreateBulkTuitionPaymentUseCase,
  tuitionPaymentUseCase.GetTuitionPaymentsUseCase,
  tuitionPaymentUseCase.GetTuitionPaymentByIdUseCase,
  tuitionPaymentUseCase.UpdateTuitionPaymentUseCase,
  tuitionPaymentUseCase.DeleteTuitionPaymentUseCase,
  // stats
  tuitionPaymentUseCase.GetTuitionPaymentStatsByStatusUseCase,
  tuitionPaymentUseCase.GetMyTuitionPaymentStatsByStatusUseCase,
]
@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: TUITION_PAYMENT_USE_CASES,
  exports: TUITION_PAYMENT_USE_CASES,
})
export class TuitionPaymentApplicationModule {}
