import { Module } from '@nestjs/common'

import { PaymentAttemptApplicationModule } from '../payment-attempt/payment-attempt.application.module'
import { TuitionPaymentApplicationModule } from '../tuition-payment/tuition-payment.application.module'
import { SeoTuitionPaymentAccessService, SeoTuitionPaymentService } from './seo-tuition-payment.service'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'

@Module({
  imports: [InfrastructureModule, TuitionPaymentApplicationModule, PaymentAttemptApplicationModule],
  providers: [SeoTuitionPaymentAccessService, SeoTuitionPaymentService],
  exports: [SeoTuitionPaymentAccessService, SeoTuitionPaymentService],
})
export class SeoTuitionPaymentApplicationModule {}
