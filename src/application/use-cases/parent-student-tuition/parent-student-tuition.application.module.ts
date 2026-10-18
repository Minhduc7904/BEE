import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { PaymentAttemptApplicationModule } from '../payment-attempt/payment-attempt.application.module'
import {
  GetParentStudentTuitionPaymentDetailUseCase,
  GetParentStudentTuitionPaymentInstructionsUseCase,
  GetParentStudentTuitionPaymentStatusUseCase,
  GetParentStudentTuitionPaymentsUseCase,
  ReportParentStudentTuitionTransferredUseCase,
} from '.'

const useCases = [
  GetParentStudentTuitionPaymentsUseCase,
  GetParentStudentTuitionPaymentDetailUseCase,
  GetParentStudentTuitionPaymentStatusUseCase,
  GetParentStudentTuitionPaymentInstructionsUseCase,
  ReportParentStudentTuitionTransferredUseCase,
]

@Module({
  imports: [InfrastructureModule, PaymentAttemptApplicationModule],
  providers: useCases,
  exports: useCases,
})
export class ParentStudentTuitionApplicationModule {}
