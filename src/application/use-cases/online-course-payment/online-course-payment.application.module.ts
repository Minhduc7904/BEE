import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import {
  CreateVnpayQrPaymentUseCase,
  GetOnlineCourseInvoicePaymentStatusUseCase,
  HandleVnpayIpnUseCase,
  VerifyVnpayReturnUseCase,
} from './'

const ONLINE_COURSE_PAYMENT_USE_CASES = [
  CreateVnpayQrPaymentUseCase,
  HandleVnpayIpnUseCase,
  GetOnlineCourseInvoicePaymentStatusUseCase,
  VerifyVnpayReturnUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: ONLINE_COURSE_PAYMENT_USE_CASES,
  exports: ONLINE_COURSE_PAYMENT_USE_CASES,
})
export class OnlineCoursePaymentApplicationModule {}
